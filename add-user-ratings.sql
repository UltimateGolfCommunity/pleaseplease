create table if not exists public.user_ratings (
  id uuid primary key default gen_random_uuid(),
  rated_user_id uuid not null references public.user_profiles(id) on delete cascade,
  rater_user_id uuid not null references public.user_profiles(id) on delete cascade,
  stars integer not null check (stars >= 1 and stars <= 5),
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rated_user_id, rater_user_id)
);

alter table public.user_ratings
add column if not exists review_text text;

alter table public.user_ratings enable row level security;

drop policy if exists "Users can view ratings" on public.user_ratings;
create policy "Users can view ratings"
on public.user_ratings
for select
using (true);

drop policy if exists "Users can create their own ratings" on public.user_ratings;
create policy "Users can create their own ratings"
on public.user_ratings
for insert
with check (auth.uid() = rater_user_id);

drop policy if exists "Users can update their own ratings" on public.user_ratings;
create policy "Users can update their own ratings"
on public.user_ratings
for update
using (auth.uid() = rater_user_id)
with check (auth.uid() = rater_user_id);

create index if not exists idx_user_ratings_rated_user_id on public.user_ratings(rated_user_id);
create index if not exists idx_user_ratings_rater_user_id on public.user_ratings(rater_user_id);
