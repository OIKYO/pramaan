-- Pramaan schema. Run in the Supabase SQL editor (or psql): schema.sql, then policies.sql,
-- then `python -m scripts.seed` from backend/ for the demo organisation.
--
-- Many organisations share one database. Every table that belongs to a company carries org_id, names
-- are unique within an organisation, and two-column foreign keys (id, org_id) make it impossible for
-- a branch, profile, poster or topper to point into another organisation.

create type public.user_role as enum ('branch_staff', 'regional_manager', 'head_office');
create type public.poster_status as enum ('draft', 'checked', 'in_review', 'changes_requested', 'approved');
create type public.review_stage as enum ('regional', 'head_office');
create type public.channel as enum ('print', 'instagram', 'whatsapp');
create type public.finding_kind as enum ('code', 'ai', 'reader');
create type public.severity as enum ('block', 'warn', 'pass', 'needs_human');
create type public.finding_status as enum ('open', 'resolved', 'overridden');
create type public.course_type as enum ('classroom', 'crash', 'test_series', 'online');

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  -- What it does, from backend/app/catalog.json, and the rulebooks it keeps. Backend writes only.
  industry_group text,
  industry text check (industry is null or char_length(industry) between 2 and 80),
  org_type text,
  focus text[] not null default '{}',
  rulebooks text[] not null default '{brand,contacts,claims,people,rights,dates,offers,legal}',
  join_code text unique,                              -- for joining while creating an account; API only
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  constraint regions_org_name_key unique (org_id, name),
  constraint regions_id_org_key unique (id, org_id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  city text not null,
  region_id uuid not null,
  phone text not null,
  address text not null,
  constraint branches_org_name_key unique (org_id, name),
  constraint branches_id_org_key unique (id, org_id),
  constraint branches_region_same_org foreign key (region_id, org_id) references public.regions (id, org_id)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.organisations (id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  branch_id uuid,
  region_id uuid,
  email text,
  needs_password_change boolean not null default false,  -- set while they have a temporary password
  deactivated_at timestamptz,                            -- head office removed their access
  created_at timestamptz not null default now(),
  constraint staff_belong_to_a_branch check (role <> 'branch_staff' or branch_id is not null),
  constraint regional_managers_have_a_region check (role <> 'regional_manager' or region_id is not null),
  constraint profiles_branch_same_org foreign key (branch_id, org_id) references public.branches (id, org_id),
  constraint profiles_region_same_org foreign key (region_id, org_id) references public.regions (id, org_id)
);
create index profiles_by_org on public.profiles (org_id);

create table public.brand_kit (
  org_id uuid primary key references public.organisations (id) on delete cascade, -- one per organisation
  registered_name text not null,
  helpline text not null,
  palette text[] not null default '{}',               -- hex colours, e.g. '#1F3354'
  logo_path text,                                     -- object path in the public 'brand' bucket
  banned_phrases text[] not null default '{}',        -- added to the built-in CCPA-01 list
  tone_notes text not null default '',
  required_disclaimers text[] not null default '{}',  -- LEGAL-01: every poster must carry each one
  approved_partners text[] not null default '{}',     -- RIGHTS-02: other organisations allowed on posters
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  aliases text[] not null default '{}',
  course_type public.course_type,                     -- courses only
  duration_label text,                                -- as written on posters, e.g. '2 years'
  duration_months int check (duration_months > 0),
  fee_inr int check (fee_inr is null or fee_inr >= 0),
  is_paid boolean not null,
  valid_until date,
  source text not null default '',
  constraint paid_courses_have_a_fee check (not is_paid or fee_inr is not null),
  constraint courses_org_name_key unique (org_id, name),
  constraint courses_id_org_key unique (id, org_id)
);

create table public.result_stats (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  label text not null,
  value numeric not null,
  exam text,
  year int,
  source text not null default '',
  valid_until date,
  constraint result_stats_org_label_key unique (org_id, label)
);

create table public.toppers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  full_name text not null,
  name_variants text[] not null default '{}',
  exam text,                                          -- exam fields: the exam results rulebook
  exam_year int,
  rank int check (rank > 0),
  result_date date,
  course_id uuid,
  is_minor boolean not null default false,
  photo_path text,
  consent_path text,                                  -- object path in the private 'consent' bucket
  has_consent boolean generated always as (consent_path is not null) stored,
  consent_date date,
  consent_channels public.channel[] not null default '{}',
  consent_valid_until date,
  guardian_signed boolean not null default false,
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  constraint toppers_org_name_key unique (org_id, full_name),
  constraint toppers_course_same_org foreign key (course_id, org_id) references public.courses (id, org_id)
);

-- Which checks each organisation has switched on. The checks live in backend/rules/rule_pack.json.
create table public.rule_settings (
  org_id uuid not null references public.organisations (id) on delete cascade,
  rule_id text not null,
  enabled boolean not null default true,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  primary key (org_id, rule_id)
);

create table public.posters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  branch_id uuid not null,
  created_by uuid not null references public.profiles (id),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  channel public.channel not null,
  status public.poster_status not null default 'draft',
  review_stage public.review_stage,
  current_version int not null default 1 check (current_version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stage_only_while_in_review check ((status = 'in_review') = (review_stage is not null)),
  constraint posters_branch_same_org foreign key (branch_id, org_id) references public.branches (id, org_id)
);
create index posters_by_org on public.posters (org_id, updated_at desc);
create index posters_by_branch on public.posters (branch_id, updated_at desc);
create index posters_by_status on public.posters (status, review_stage, updated_at desc);

create table public.poster_versions (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.posters (id) on delete cascade,
  version int not null check (version >= 1),
  image_path text not null,                           -- object path in the private 'posters' bucket
  image_sha256 text not null,
  caption text not null default '',
  alt_text text not null default '',
  tagged_topper_ids uuid[] not null default '{}',
  reading jsonb,                                      -- the validated PosterReading
  reader_model text,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (poster_id, version)
);
create index poster_versions_by_hash on public.poster_versions (image_sha256);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.poster_versions (id) on delete cascade,
  rule_id text not null,
  kind public.finding_kind not null,
  severity public.severity not null,
  message text not null,
  reason text not null default '',
  evidence jsonb not null default '{}',               -- e.g. {"box_2d": [ymin, xmin, ymax, xmax], "text": "..."}
  suggested_fix text,
  status public.finding_status not null default 'open',
  override_reason text,
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ai_findings_never_block check (kind <> 'ai' or severity in ('warn', 'pass')),
  constraint overrides_need_a_reason check (status <> 'overridden' or coalesce(btrim(override_reason), '') <> '')
);
create index findings_by_version on public.findings (version_id);
create index findings_by_rule on public.findings (rule_id, severity);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.posters (id) on delete cascade,
  version_id uuid references public.poster_versions (id) on delete set null,
  actor_id uuid not null references public.profiles (id),
  action text not null check (action in (
    'created', 'new_version', 'checked', 'submitted', 'approved', 'final_approved', 'sent_back',
    'finding_resolved', 'finding_overridden'
  )),
  comment text,
  created_at timestamptz not null default now()
);
create index reviews_by_poster on public.reviews (poster_id, created_at);

create table public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organisations (id) on delete cascade,
  actor_id uuid references public.profiles (id),      -- null for the pipeline itself
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_log_by_time on public.audit_log (created_at desc);
create index audit_log_by_org on public.audit_log (org_id, created_at desc);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger posters_touch before update on public.posters
  for each row execute function public.touch_updated_at();
create trigger brand_kit_touch before update on public.brand_kit
  for each row execute function public.touch_updated_at();
create trigger rule_settings_touch before update on public.rule_settings
  for each row execute function public.touch_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('posters', 'posters', false, 15728640, array['image/png', 'image/jpeg', 'image/webp']),
  ('consent', 'consent', false, 10485760, array['application/pdf']),
  ('brand', 'brand', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- Single-use invite links (backend only; see backend/app/invites.py). Only a hash of each token is kept.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  token_hash text not null unique,
  role public.user_role not null,
  branch_id uuid,
  region_id uuid,
  email text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  constraint invites_branch_same_org foreign key (branch_id, org_id) references public.branches (id, org_id) on delete cascade,
  constraint invites_region_same_org foreign key (region_id, org_id) references public.regions (id, org_id) on delete cascade
);
create index invites_org_idx on public.invites (org_id);

-- Keep the API awake. Render's free plan sleeps after 15 idle minutes and GitHub runs free scheduled
-- jobs late, so Supabase's own scheduler calls /health?db=true every 10 minutes, which also keeps the
-- database active. For another deployment, change the URL. Running this again replaces the job.
-- Check it: select * from cron.job_run_details order by start_time desc limit 5;
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'pramaan-keep-awake';

select cron.schedule(
  'pramaan-keep-awake',
  '*/10 * * * *',
  $$ select net.http_get(url := 'https://pramaan-api-6p3b.onrender.com/health?db=true', timeout_milliseconds := 90000) $$
);
