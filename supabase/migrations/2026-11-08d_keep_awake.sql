-- Keep Pramaan's API awake. Run once in the Supabase SQL editor; running it again replaces the job.
--
-- Render's free plan puts the API to sleep after 15 minutes without a request, and the next person
-- then waits about a minute. GitHub's scheduled workflow (.github/workflows/keep-awake.yml) was meant
-- to prevent that, but GitHub runs free scheduled jobs late or not at all. Supabase's own scheduler
-- (pg_cron) with its HTTP extension (pg_net) runs on time, on the free plan too, and the request also
-- keeps the database itself active.
--
-- Check it's working:  select * from cron.job_run_details order by start_time desc limit 5;
-- Stop it:             select cron.unschedule('pramaan-keep-awake');

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'pramaan-keep-awake';

select cron.schedule(
  'pramaan-keep-awake',
  '*/10 * * * *',
  $$ select net.http_get(url := 'https://pramaan-api-6p3b.onrender.com/health?db=true', timeout_milliseconds := 90000) $$
);
