-- Row-level security for Pramaan. Run after schema.sql.
--
-- Every rule starts with "your organisation only": nobody sees or changes another company's data.
-- Inside an organisation:
--   branch staff      read their own branch's posters; read the rulebook
--   regional managers read posters from branches in their region; read the rulebook
--   head office       read everything; edit the rulebook, regions and branches
-- Posters, versions, findings, reviews, profiles and the audit log are written only by the backend,
-- which uses the secret (service role) key and bypasses RLS. Clients get no write access to them.

-- SECURITY DEFINER so policies can read the caller's profile without recursing into its RLS.
-- A removed member (deactivated_at set) gets null from all of these, and so loses access at once.
create function public.my_org() returns uuid
language sql stable security definer set search_path = ''
as $$ select org_id from public.profiles where id = auth.uid() and deactivated_at is null $$;

create function public.my_role() returns public.user_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() and deactivated_at is null $$;

create function public.my_branch() returns uuid
language sql stable security definer set search_path = ''
as $$ select branch_id from public.profiles where id = auth.uid() $$;

create function public.my_region() returns uuid
language sql stable security definer set search_path = ''
as $$ select region_id from public.profiles where id = auth.uid() $$;

create function public.can_see_branch(target_branch uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select case public.my_role()
      when 'head_office' then true
      when 'branch_staff' then b.id = public.my_branch()
      when 'regional_manager' then b.region_id = public.my_region()
    end
    from public.branches b
    where b.id = target_branch and b.org_id = public.my_org()
  ), false)
$$;

-- Rows head office adds from the browser land in their own organisation.
alter table public.regions alter column org_id set default public.my_org();
alter table public.branches alter column org_id set default public.my_org();
alter table public.courses alter column org_id set default public.my_org();
alter table public.result_stats alter column org_id set default public.my_org();
alter table public.toppers alter column org_id set default public.my_org();
alter table public.rule_settings alter column org_id set default public.my_org();

-- Signed-out visitors get nothing. (Signing up goes through the backend.)
revoke all on all tables in schema public from anon;

-- Organisations: members read theirs (but not its join code, which comes through the API); head
-- office may rename it. Creating one is backend-only.
revoke all on public.organisations from authenticated;
grant select (id, name, industry_group, industry, org_type, focus, rulebooks, created_by, created_at)
  on public.organisations to authenticated;

-- Invites are backend-only.
revoke all on public.invites from anon, authenticated;
grant update (name) on public.organisations to authenticated;

-- Backend-only tables: clients may read (subject to RLS) but never write.
revoke insert, update, delete on
  public.profiles, public.posters, public.poster_versions, public.findings, public.reviews, public.audit_log
from authenticated;

-- toppers.consent_path is hidden from every client. Head office opens consent files through the
-- backend (short-lived signed URL); everyone sees `has_consent` instead.
revoke select, insert, update on public.toppers from authenticated;
grant select (
  id, org_id, full_name, name_variants, exam, exam_year, rank, result_date, course_id, is_minor, photo_path,
  has_consent, consent_date, consent_channels, consent_valid_until, guardian_signed, verified_by, verified_at
) on public.toppers to authenticated;
grant insert (
  full_name, name_variants, exam, exam_year, rank, result_date, course_id, is_minor,
  consent_date, consent_channels, consent_valid_until, guardian_signed
) on public.toppers to authenticated;
grant update (
  full_name, name_variants, exam, exam_year, rank, result_date, course_id, is_minor,
  consent_date, consent_channels, consent_valid_until, guardian_signed
) on public.toppers to authenticated;

alter table public.organisations enable row level security;
alter table public.invites enable row level security;
alter table public.regions enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.brand_kit enable row level security;
alter table public.courses enable row level security;
alter table public.result_stats enable row level security;
alter table public.toppers enable row level security;
alter table public.rule_settings enable row level security;
alter table public.posters enable row level security;
alter table public.poster_versions enable row level security;
alter table public.findings enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_log enable row level security;

create policy "organisations: members read their own" on public.organisations for select to authenticated
  using (id = (select public.my_org()));
create policy "organisations: head office renames" on public.organisations for update to authenticated
  using (id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (id = (select public.my_org()));

create policy "profiles: own organisation" on public.profiles for select to authenticated
  using (org_id = (select public.my_org()));

-- Regions, branches and the rulebook: everyone in the organisation reads; head office edits.
create policy "regions: own organisation" on public.regions for select to authenticated
  using (org_id = (select public.my_org()));
create policy "regions: head office edits" on public.regions for all to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office');

create policy "branches: own organisation" on public.branches for select to authenticated
  using (org_id = (select public.my_org()));
create policy "branches: head office edits" on public.branches for all to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office');

create policy "brand kit: own organisation" on public.brand_kit for select to authenticated
  using (org_id = (select public.my_org()));
create policy "brand kit: head office edits" on public.brand_kit for update to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (org_id = (select public.my_org()));

create policy "courses: own organisation" on public.courses for select to authenticated
  using (org_id = (select public.my_org()));
create policy "courses: head office edits" on public.courses for all to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office');

create policy "result stats: own organisation" on public.result_stats for select to authenticated
  using (org_id = (select public.my_org()));
create policy "result stats: head office edits" on public.result_stats for all to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office');

create policy "toppers: own organisation" on public.toppers for select to authenticated
  using (org_id = (select public.my_org()));
create policy "toppers: head office edits" on public.toppers for all to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office');

create policy "rule settings: own organisation" on public.rule_settings for select to authenticated
  using (org_id = (select public.my_org()));
create policy "rule settings: head office edits" on public.rule_settings for all to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office');

-- Posters and everything hanging off them: visible exactly when the branch is (which already
-- includes "in your organisation"). The subqueries run under posters' own policy.
create policy "posters: by branch and region" on public.posters for select to authenticated
  using ((select public.can_see_branch(branch_id)));

create policy "poster versions: with the poster" on public.poster_versions for select to authenticated
  using (exists (select 1 from public.posters p where p.id = poster_id));

create policy "findings: with the version" on public.findings for select to authenticated
  using (exists (select 1 from public.poster_versions v where v.id = version_id));

create policy "reviews: with the poster" on public.reviews for select to authenticated
  using (exists (select 1 from public.posters p where p.id = poster_id));

create policy "audit log: head office reads their own" on public.audit_log for select to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office');

-- Poster images: paths are '{poster_id}/v{version}-{hash}.{ext}'. Readable (signed URLs) by anyone
-- who can see the poster. Uploads go through the backend.
create policy "poster images: read with the poster" on storage.objects for select to authenticated
  using (
    bucket_id = 'posters'
    and exists (select 1 from public.posters p where p.id::text = (storage.foldername(name))[1])
  );

-- Logos: the 'brand' bucket is public to read. Head office uploads only into '{their org_id}/...'.
create policy "brand files: head office uploads to their folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'brand' and (storage.foldername(name))[1] = (select public.my_org())::text
              and (select public.my_role()) = 'head_office');
create policy "brand files: head office replaces in their folder" on storage.objects for update to authenticated
  using (bucket_id = 'brand' and (storage.foldername(name))[1] = (select public.my_org())::text
         and (select public.my_role()) = 'head_office');

-- The 'consent' bucket has no policies on purpose: no client can list, read or write it.
