-- Organisations: one Pramaan can serve many companies, each seeing only its own data.
--
-- For a database created before 7 Nov 2026 (single company). Run once, in the SQL editor or psql.
-- A new database doesn't need this: schema.sql and policies.sql already include organisations.
--
-- What it does:
--   1. adds `organisations`, and moves the existing (Northfield Academy demo) data into the first one;
--   2. adds org_id to every table that belongs to a company, with names unique per organisation;
--   3. makes cross-organisation references impossible (a branch can't sit in another org's region);
--   4. rewrites every row-level-security policy as "your organisation only".
begin;

-- ============================================================ 1. organisations

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.organisations (id, name) values ('00000000-0000-4000-8000-000000000001', 'Northfield Academy');

-- ============================================================ 2. org_id everywhere

do $$
declare t text;
begin
  foreach t in array array['regions', 'branches', 'profiles', 'brand_kit', 'courses', 'result_stats',
                           'toppers', 'rule_settings', 'posters', 'audit_log'] loop
    execute format('alter table public.%I add column org_id uuid references public.organisations (id) on delete cascade', t);
    execute format('update public.%I set org_id = %L', t, '00000000-0000-4000-8000-000000000001');
    execute format('alter table public.%I alter column org_id set not null', t);
  end loop;
end $$;

-- Team members: their email (shown to head office), whether they must choose a new password,
-- and whether head office removed their access.
alter table public.profiles
  add column email text,
  add column needs_password_change boolean not null default false,
  add column deactivated_at timestamptz,
  add column created_at timestamptz not null default now();
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

-- Names are unique within an organisation, not across all of them.
alter table public.regions drop constraint regions_name_key, add constraint regions_org_name_key unique (org_id, name);
alter table public.branches drop constraint branches_name_key, add constraint branches_org_name_key unique (org_id, name);
alter table public.courses drop constraint courses_name_key, add constraint courses_org_name_key unique (org_id, name);
alter table public.result_stats drop constraint result_stats_label_key, add constraint result_stats_org_label_key unique (org_id, label);
alter table public.toppers drop constraint toppers_full_name_key, add constraint toppers_org_name_key unique (org_id, full_name);

-- One brand kit and one set of rule switches per organisation.
alter table public.brand_kit drop constraint brand_kit_pkey;
alter table public.brand_kit drop column id;
alter table public.brand_kit add primary key (org_id);
alter table public.rule_settings drop constraint rule_settings_pkey, add primary key (org_id, rule_id);

-- ============================================================ 3. no references across organisations

alter table public.regions add constraint regions_id_org_key unique (id, org_id);
alter table public.branches add constraint branches_id_org_key unique (id, org_id);
alter table public.courses add constraint courses_id_org_key unique (id, org_id);

alter table public.branches add constraint branches_region_same_org
  foreign key (region_id, org_id) references public.regions (id, org_id);
alter table public.profiles add constraint profiles_branch_same_org
  foreign key (branch_id, org_id) references public.branches (id, org_id);
alter table public.profiles add constraint profiles_region_same_org
  foreign key (region_id, org_id) references public.regions (id, org_id);
alter table public.posters add constraint posters_branch_same_org
  foreign key (branch_id, org_id) references public.branches (id, org_id);
alter table public.toppers add constraint toppers_course_same_org
  foreign key (course_id, org_id) references public.courses (id, org_id);

-- The two-column keys above do everything the old one-column keys did, and more. Keeping both would
-- leave the API two ways to join the same tables, so the old ones go.
alter table public.branches drop constraint branches_region_id_fkey;
alter table public.profiles drop constraint profiles_branch_id_fkey, drop constraint profiles_region_id_fkey;
alter table public.posters drop constraint posters_branch_id_fkey;
alter table public.toppers drop constraint toppers_course_id_fkey;

create index posters_by_org on public.posters (org_id, updated_at desc);
create index audit_log_by_org on public.audit_log (org_id, created_at desc);
create index profiles_by_org on public.profiles (org_id);

-- ============================================================ 4. helpers and policies

-- The caller's organisation. Null for a removed member, so they lose all access at once.
create function public.my_org() returns uuid
language sql stable security definer set search_path = ''
as $$ select org_id from public.profiles where id = auth.uid() and deactivated_at is null $$;

create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() and deactivated_at is null $$;

create or replace function public.can_see_branch(target_branch uuid) returns boolean
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

-- Head office now manages regions and branches from the app. Profiles stay backend-only
-- (creating a team member also creates their sign-in), and so does creating an organisation.
revoke all on public.organisations from anon, authenticated;
grant select on public.organisations to authenticated;
grant update (name) on public.organisations to authenticated;
grant insert, update, delete on public.regions, public.branches to authenticated;
grant select (org_id) on public.toppers to authenticated;
alter table public.organisations enable row level security;

drop policy "regions: signed-in users read" on public.regions;
drop policy "branches: signed-in users read" on public.branches;
drop policy "profiles: signed-in users read" on public.profiles;
drop policy "brand kit: read" on public.brand_kit;
drop policy "brand kit: head office edits" on public.brand_kit;
drop policy "courses: read" on public.courses;
drop policy "courses: head office edits" on public.courses;
drop policy "result stats: read" on public.result_stats;
drop policy "result stats: head office edits" on public.result_stats;
drop policy "toppers: read" on public.toppers;
drop policy "toppers: head office edits" on public.toppers;
drop policy "rule settings: read" on public.rule_settings;
drop policy "rule settings: head office edits" on public.rule_settings;
drop policy "audit log: head office reads" on public.audit_log;

create policy "organisations: members read their own" on public.organisations for select to authenticated
  using (id = (select public.my_org()));
create policy "organisations: head office renames" on public.organisations for update to authenticated
  using (id = (select public.my_org()) and (select public.my_role()) = 'head_office')
  with check (id = (select public.my_org()));

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

create policy "profiles: own organisation" on public.profiles for select to authenticated
  using (org_id = (select public.my_org()));

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

create policy "audit log: head office reads their own" on public.audit_log for select to authenticated
  using (org_id = (select public.my_org()) and (select public.my_role()) = 'head_office');

-- Logos: head office uploads to '{org_id}/...' in the public 'brand' bucket.
create policy "brand files: head office uploads to their folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'brand' and (storage.foldername(name))[1] = (select public.my_org())::text
              and (select public.my_role()) = 'head_office');
create policy "brand files: head office replaces in their folder" on storage.objects for update to authenticated
  using (bucket_id = 'brand' and (storage.foldername(name))[1] = (select public.my_org())::text
         and (select public.my_role()) = 'head_office');

commit;
