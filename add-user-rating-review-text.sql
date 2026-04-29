alter table public.user_ratings
add column if not exists review_text text;
