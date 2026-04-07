create table if not exists public.user_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_name text not null,
  holes_played integer not null check (holes_played in (9, 18)),
  hole_scores jsonb not null,
  total_score integer not null,
  average_score_per_hole numeric(6,2) not null,
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_rounds_user_id_played_at_idx
  on public.user_rounds (user_id, played_at desc);

alter table public.user_rounds enable row level security;

drop policy if exists "Users can view their own rounds" on public.user_rounds;
create policy "Users can view their own rounds"
  on public.user_rounds
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own rounds" on public.user_rounds;
create policy "Users can insert their own rounds"
  on public.user_rounds
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own rounds" on public.user_rounds;
create policy "Users can update their own rounds"
  on public.user_rounds
  for update
  using (auth.uid() = user_id);
