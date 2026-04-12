alter table if exists public.user_profiles
add column if not exists bag_items jsonb not null default '{}'::jsonb;

comment on column public.user_profiles.bag_items is 'Structured golf bag details for the golfer profile in the mobile app.';
