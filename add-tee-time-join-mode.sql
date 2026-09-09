-- Run once in Supabase SQL Editor before deploying the automatic-join tee-time feature.
alter table public.tee_times
  add column if not exists join_mode text not null default 'request';

alter table public.tee_times
  drop constraint if exists tee_times_join_mode_check;

alter table public.tee_times
  add constraint tee_times_join_mode_check
  check (join_mode in ('request', 'auto'));
