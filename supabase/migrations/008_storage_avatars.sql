begin;

-- Create a public bucket for profile avatars (safe: only user can write their own path).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow anyone to read avatar images (bucket is public, but keep explicit policy too).
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
for select
using (bucket_id = 'avatars');

-- Allow authenticated users to upload/update/delete ONLY within their own folder: avatars/<uid>/...
drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write" on storage.objects
for all
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;

