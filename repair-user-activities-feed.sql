create extension if not exists pgcrypto;

create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  activity_type text not null,
  title text not null,
  description text,
  related_id uuid,
  related_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_activities
  add column if not exists related_type text;

alter table public.user_activities
  add column if not exists metadata jsonb;

alter table public.user_activities
  alter column metadata set default '{}'::jsonb;

update public.user_activities
set metadata = '{}'::jsonb
where metadata is null;

alter table public.user_activities
  alter column metadata set not null;

alter table public.user_activities
  add column if not exists updated_at timestamptz;

update public.user_activities
set updated_at = created_at
where updated_at is null;

alter table public.user_activities
  alter column updated_at set default now();

do $$
declare
  activity_udt text;
begin
  select udt_name
  into activity_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'user_activities'
    and column_name = 'activity_type';

  if activity_udt is not null and activity_udt <> 'text' then
    execute 'alter table public.user_activities alter column activity_type type text using activity_type::text';
  end if;
end
$$;

create index if not exists idx_user_activities_user_id
on public.user_activities(user_id);

create index if not exists idx_user_activities_created_at
on public.user_activities(created_at desc);

create index if not exists idx_user_activities_activity_type
on public.user_activities(activity_type);

create index if not exists idx_user_activities_related_id
on public.user_activities(related_id);

create index if not exists idx_user_activities_related_type
on public.user_activities(related_type);

create index if not exists idx_user_activities_user_created_at
on public.user_activities(user_id, created_at desc);

alter table public.user_activities enable row level security;

drop policy if exists "Users can view own activities" on public.user_activities;
create policy "Users can view own activities"
on public.user_activities
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own activities" on public.user_activities;
create policy "Users can insert own activities"
on public.user_activities
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own activities" on public.user_activities;
create policy "Users can update own activities"
on public.user_activities
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own activities" on public.user_activities;
create policy "Users can delete own activities"
on public.user_activities
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "System can insert activities" on public.user_activities;
create policy "System can insert activities"
on public.user_activities
for insert
to authenticated
with check (true);

grant all on public.user_activities to anon, authenticated;

insert into public.user_activities (
  user_id,
  activity_type,
  title,
  description,
  related_id,
  related_type,
  metadata,
  created_at,
  updated_at
)
select
  tt.creator_id,
  'tee_time_created',
  'Posted a tee time',
  concat('Booked ', coalesce(nullif(tt.course_name, ''), 'a new round'), ' for ', tt.tee_time_date::text),
  tt.id,
  'tee_time',
  jsonb_strip_nulls(
    jsonb_build_object(
      'course_name', coalesce(nullif(tt.course_name, ''), 'Unnamed Course'),
      'location', coalesce(tt.course_location, ''),
      'tee_time_date', tt.tee_time_date,
      'tee_time_time', tt.tee_time_time
    )
  ),
  coalesce(tt.created_at, now()),
  coalesce(tt.updated_at, tt.created_at, now())
from public.tee_times tt
where tt.creator_id is not null
  and not exists (
    select 1
    from public.user_activities ua
    where ua.related_type = 'tee_time'
      and ua.related_id = tt.id
      and ua.activity_type in ('tee_time_created', 'tee_time_updated')
  );
