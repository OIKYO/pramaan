-- Pramaan for any industry: each organisation says what it does and which rulebooks it keeps.
-- Run once in the Supabase SQL editor on a database created before 8 Nov 2026. New installs get
-- all of this from schema.sql.
--
--  * organisations: industry (from the catalog in backend/app/catalog.json), kind of organisation,
--    what it uses Pramaan for, and its rulebooks. Written only by the backend (PATCH /organisation),
--    which checks them against the catalog: the client can still change only the name.
--  * Fields that only coaching institutes have become optional: course type and duration, the exam
--    behind a figure, and a person's exam, rank and result date. The exam results rulebook asks
--    for them again where it applies.

begin;

alter table public.organisations
  add column industry_group text,
  add column industry text check (industry is null or char_length(industry) between 2 and 80),
  add column org_type text,
  add column focus text[] not null default '{}',
  add column rulebooks text[] not null default '{brand,contacts,claims,offerings,figures,people}';

-- The demo organisation is a coaching institute and keeps every rulebook.
update public.organisations
   set industry_group = 'education', industry = 'Coaching Institutes', org_type = 'coaching',
       focus = '{admissions,results}', rulebooks = '{brand,contacts,claims,offerings,figures,people,rankings}'
 where id = '00000000-0000-4000-8000-000000000001';

alter table public.courses
  alter column course_type drop not null,
  alter column duration_label drop not null,
  alter column duration_months drop not null;

alter table public.result_stats
  alter column exam drop not null,
  alter column year drop not null;

alter table public.toppers
  alter column exam drop not null,
  alter column exam_year drop not null,
  alter column rank drop not null,
  alter column result_date drop not null;

commit;
