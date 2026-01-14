-- Bucket for enxoval product images
insert into storage.buckets (id, name, public)
values ('enxoval-images', 'enxoval-images', true)
on conflict (id) do nothing;

-- Allow anyone to read images from this bucket
create policy "Public read access for enxoval images"
  on storage.objects
  for select
  using (bucket_id = 'enxoval-images');

-- Allow anyone to upload images to this bucket
create policy "Public upload for enxoval images"
  on storage.objects
  for insert
  with check (bucket_id = 'enxoval-images');

-- Allow anyone to update images in this bucket
create policy "Public update for enxoval images"
  on storage.objects
  for update
  using (bucket_id = 'enxoval-images');

-- Allow anyone to delete images in this bucket
create policy "Public delete for enxoval images"
  on storage.objects
  for delete
  using (bucket_id = 'enxoval-images');