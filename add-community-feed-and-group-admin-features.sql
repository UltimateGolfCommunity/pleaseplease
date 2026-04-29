alter table public.golf_groups
add column if not exists slogan text;

alter table public.golf_courses
add column if not exists logo_url text,
add column if not exists course_image_url text,
add column if not exists year_founded text;

alter table public.course_reviews
add column if not exists course_condition_rating integer,
add column if not exists staff_rating integer,
add column if not exists price_rating integer,
add column if not exists difficulty_rating integer,
add column if not exists photo_url text;

alter table public.group_messages
add column if not exists parent_message_id uuid references public.group_messages(id) on delete cascade;

create table if not exists public.group_message_likes (
  id uuid primary key default gen_random_uuid(),
  group_message_id uuid not null references public.group_messages(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(group_message_id, user_id)
);

create index if not exists idx_group_messages_parent_message_id
on public.group_messages(parent_message_id);

create index if not exists idx_group_message_likes_message_id
on public.group_message_likes(group_message_id);

create index if not exists idx_group_message_likes_user_id
on public.group_message_likes(user_id);

create table if not exists public.activity_likes (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.user_activities(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(activity_id, user_id)
);

create table if not exists public.activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.user_activities(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_activity_likes_activity_id
on public.activity_likes(activity_id);

create index if not exists idx_activity_likes_user_id
on public.activity_likes(user_id);

create index if not exists idx_activity_comments_activity_id
on public.activity_comments(activity_id);

create index if not exists idx_activity_comments_user_id
on public.activity_comments(user_id);
