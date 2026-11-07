-- Invites and join codes. Run once in the Supabase SQL editor, after 2026-11-08b_general_rulebooks.sql.
-- New installs get all of this from schema.sql and policies.sql.
--
--  * organisations.join_code: the code people enter when they create an account to join. The
--    backend fills it in the first time head office or a regional manager asks for it, and replaces
--    it on request. Browsers can't read it straight from the table: it comes through the API.
--  * invites: single-use links for one person, with a role and a branch or region. Only a hash of
--    each link's token is stored. Backend only: no browser access at all.

begin;

alter table public.organisations add column join_code text;
alter table public.organisations add constraint organisations_join_code_key unique (join_code);

-- Members read their organisation, but not its join code.
revoke select on public.organisations from authenticated;
grant select (id, name, industry_group, industry, org_type, focus, rulebooks, created_by, created_at)
  on public.organisations to authenticated;

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
alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;

commit;
