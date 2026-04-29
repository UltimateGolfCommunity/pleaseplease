alter table public.user_profiles
add column if not exists expo_push_token text;

alter table public.user_profiles
add column if not exists push_notifications_enabled boolean not null default false;

alter table public.notifications
add column if not exists notification_data jsonb default '{}'::jsonb;

create index if not exists idx_user_profiles_expo_push_token
on public.user_profiles(expo_push_token);
