-- Row-level security for Pramaan. Run after schema.sql.
--
-- Who can do what (CLAUDE.md section 6):
--   branch staff      read their own branch's posters; read the rulebook
--   regional managers read posters from branches in their region; read the rulebook
--   head office       read everything; edit the rulebook
-- Posters, versions, findings, reviews and the audit log are written only by the backend, which
-- uses the secret (service role) key and bypasses RLS. Clients get no write access to them at all.

-- ============================================================ helpers

-- SECURITY DEFINER so policies can read the caller's profile without recursing into its RLS.
create function public.my_role() returns public.user_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() $$;

create function public.my_branch() returns uuid
language sql stable security definer set search_path = ''
as $$ select branch_id from public.profiles where id = auth.uid() $$;

create function public.my_region() returns uuid
language sql stable security definer set search_path = ''
as $$ select region_id from public.profiles where id = auth.uid() $$;

create function public.can_see_branch(target_branch uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    case public.my_role()
      when 'head_office' then true
      when 'branch_staff' then target_branch = public.my_branch()
      when 'regional_manager' then exists (
        select 1 from public.branches b
        where b.id = target_branch and b.region_id = public.my_region()
      )
    end,
    false
  )
$$;

-- ============================================================ table privileges

-- Signed-out visitors get nothing.
revoke all on all tables in schema public from anon;

-- Backend-only tables: clients may read (subject to RLS) but never write.
revoke insert, update, delete on
  public.regions, public.branches, public.profiles,
  public.posters, public.poster_versions, public.findings, public.reviews, public.audit_log
from authenticated;

-- toppers.consent_path is hidden from every client. Head office opens consent files through the
-- backend (short-lived signed URL); everyone sees `has_consent` instead.
revoke select, insert, update on public.toppers from authenticated;
grant select (
  id, full_name, name_variants, exam, exam_year, rank, result_date, course_id, is_minor, photo_path,
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

-- ============================================================ row-level security

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

-- Organisation: every signed-in user can read names of regions, branches and colleagues.
create policy "regions: signed-in users read" on public.regions for select to authenticated using (true);
create policy "branches: signed-in users read" on public.branches for select to authenticated using (true);
create policy "profiles: signed-in users read" on public.profiles for select to authenticated using (true);

-- Rulebook: everyone reads; only head office writes.
create policy "brand kit: read" on public.brand_kit for select to authenticated using (true);
create policy "brand kit: head office edits" on public.brand_kit for update to authenticated
  using ((select public.my_role()) = 'head_office')
  with check ((select public.my_role()) = 'head_office');

create policy "courses: read" on public.courses for select to authenticated using (true);
create policy "courses: head office edits" on public.courses for all to authenticated
  using ((select public.my_role()) = 'head_office')
  with check ((select public.my_role()) = 'head_office');

create policy "result stats: read" on public.result_stats for select to authenticated using (true);
create policy "result stats: head office edits" on public.result_stats for all to authenticated
  using ((select public.my_role()) = 'head_office')
  with check ((select public.my_role()) = 'head_office');

create policy "toppers: read" on public.toppers for select to authenticated using (true);
create policy "toppers: head office edits" on public.toppers for all to authenticated
  using ((select public.my_role()) = 'head_office')
  with check ((select public.my_role()) = 'head_office');

create policy "rule settings: read" on public.rule_settings for select to authenticated using (true);
create policy "rule settings: head office edits" on public.rule_settings for all to authenticated
  using ((select public.my_role()) = 'head_office')
  with check ((select public.my_role()) = 'head_office');

-- Posters and everything hanging off them: visible exactly when the branch is.
-- The subqueries run under posters' own policy, so visibility follows the poster.
create policy "posters: by branch and region" on public.posters for select to authenticated
  using ((select public.can_see_branch(branch_id)));

create policy "poster versions: with the poster" on public.poster_versions for select to authenticated
  using (exists (select 1 from public.posters p where p.id = poster_id));

create policy "findings: with the version" on public.findings for select to authenticated
  using (exists (select 1 from public.poster_versions v where v.id = version_id));

create policy "reviews: with the poster" on public.reviews for select to authenticated
  using (exists (select 1 from public.posters p where p.id = poster_id));

create policy "audit log: head office reads" on public.audit_log for select to authenticated
  using ((select public.my_role()) = 'head_office');

-- ============================================================ storage

-- Poster images: paths are '{poster_id}/v{version}-{hash}.{ext}'. Readable (signed URLs) by anyone
-- who can see the poster. Uploads go through the backend.
create policy "poster images: read with the poster" on storage.objects for select to authenticated
  using (
    bucket_id = 'posters'
    and exists (select 1 from public.posters p where p.id::text = (storage.foldername(name))[1])
  );

-- The 'consent' bucket has no policies on purpose: no client can list, read or write it.
-- The 'brand' bucket is public (the logo), so it needs no read policy.
