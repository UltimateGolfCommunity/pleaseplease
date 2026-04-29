insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can view uploads bucket" on storage.objects;
create policy "Public can view uploads bucket"
on storage.objects
for select
to public
using (bucket_id = 'uploads');

drop policy if exists "Authenticated users can upload to uploads bucket" on storage.objects;
create policy "Authenticated users can upload to uploads bucket"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'uploads');

drop policy if exists "Authenticated users can update uploads bucket" on storage.objects;
create policy "Authenticated users can update uploads bucket"
on storage.objects
for update
to authenticated
using (bucket_id = 'uploads')
with check (bucket_id = 'uploads');

drop policy if exists "Authenticated users can delete from uploads bucket" on storage.objects;
create policy "Authenticated users can delete from uploads bucket"
on storage.objects
for delete
to authenticated
using (bucket_id = 'uploads');
