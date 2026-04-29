alter table public.user_activities enable row level security;

drop policy if exists "Users can view own activities" on public.user_activities;
create policy "Users can view own activities"
on public.user_activities
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view connection activities" on public.user_activities;
create policy "Users can view connection activities"
on public.user_activities
for select
to authenticated
using (
  exists (
    select 1
    from public.user_connections uc
    where uc.status = 'accepted'
      and (
        (uc.requester_id = auth.uid() and uc.recipient_id = user_activities.user_id)
        or
        (uc.recipient_id = auth.uid() and uc.requester_id = user_activities.user_id)
      )
  )
);

alter table public.activity_likes enable row level security;

drop policy if exists "Authenticated users can view activity likes" on public.activity_likes;
create policy "Authenticated users can view activity likes"
on public.activity_likes
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can like activities" on public.activity_likes;
create policy "Authenticated users can like activities"
on public.activity_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can unlike own activity likes" on public.activity_likes;
create policy "Authenticated users can unlike own activity likes"
on public.activity_likes
for delete
to authenticated
using (auth.uid() = user_id);

alter table public.activity_comments enable row level security;

drop policy if exists "Authenticated users can view activity comments" on public.activity_comments;
create policy "Authenticated users can view activity comments"
on public.activity_comments
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create activity comments" on public.activity_comments;
create policy "Authenticated users can create activity comments"
on public.activity_comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can update own activity comments" on public.activity_comments;
create policy "Authenticated users can update own activity comments"
on public.activity_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can delete own activity comments" on public.activity_comments;
create policy "Authenticated users can delete own activity comments"
on public.activity_comments
for delete
to authenticated
using (auth.uid() = user_id);
