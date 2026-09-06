alter table if exists public.user_profiles
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists x_url text;

comment on column public.user_profiles.linkedin_url is 'Optional public LinkedIn profile URL.';
comment on column public.user_profiles.instagram_url is 'Optional public Instagram profile URL.';
comment on column public.user_profiles.facebook_url is 'Optional public Facebook profile URL.';
comment on column public.user_profiles.x_url is 'Optional public X profile URL.';
