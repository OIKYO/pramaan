-- The four general rulebooks: dates, offers, copyright and legal. Run once in the Supabase SQL editor,
-- after 2026-11-08_rulebooks.sql. New installs get all of this from schema.sql.
--
--  * brand_kit gains two lists head office keeps: disclaimers every poster must carry (LEGAL-01) and
--    other organisations allowed on posters (RIGHTS-02).
--  * Existing organisations start keeping the general rulebooks that every new organisation starts
--    with: dates, offers and legal act only when a poster shows a date, an offer or a claim; rights,
--    people and claims are now always on.

begin;

alter table public.brand_kit
  add column required_disclaimers text[] not null default '{}',
  add column approved_partners text[] not null default '{}';

update public.organisations
   set rulebooks = array(
         select distinct unnest(rulebooks || '{claims,people,rights,dates,offers,legal}'::text[]) order by 1);

alter table public.organisations
  alter column rulebooks set default '{brand,contacts,claims,people,rights,dates,offers,legal}';

commit;
