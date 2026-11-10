-- Profile photos live in a public-read bucket; authenticated users may write
-- only inside the folder named for their own auth user id.
alter table public.profiles
  add column if not exists avatar_path text;

alter table public.venues
  add column if not exists is_demo boolean not null default false;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own profile photos" on storage.objects;
create policy "Users upload their own profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete their own profile photos" on storage.objects;
create policy "Users delete their own profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Temporary, clearly labelled records so discovery can be exercised before
-- client venue data arrives. Replace or delete rows where is_demo is true.
insert into public.venues (
  id, name, address, city, state, latitude, longitude, description, is_demo
)
values
  ('demo_milwaukee_1', 'Venue 1', 'Placeholder address — replace before launch', 'Milwaukee', 'WI', 43.0389, -87.9065, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_milwaukee_2', 'Venue 2', 'Placeholder address — replace before launch', 'Milwaukee', 'WI', 43.0450, -87.9000, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_milwaukee_3', 'Venue 3', 'Placeholder address — replace before launch', 'Milwaukee', 'WI', 43.0500, -87.9100, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_milwaukee_4', 'Venue 4', 'Placeholder address — replace before launch', 'Milwaukee', 'WI', 43.0320, -87.9200, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_milwaukee_5', 'Venue 5', 'Placeholder address — replace before launch', 'Milwaukee', 'WI', 43.0600, -87.8900, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_milwaukee_6', 'Venue 6', 'Placeholder address — replace before launch', 'Milwaukee', 'WI', 43.0250, -87.8950, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_chicago_1', 'Venue 1', 'Placeholder address — replace before launch', 'Chicago', 'IL', 41.8781, -87.6298, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_chicago_2', 'Venue 2', 'Placeholder address — replace before launch', 'Chicago', 'IL', 41.8850, -87.6220, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_phoenix_1', 'Venue 1', 'Placeholder address — replace before launch', 'Phoenix', 'AZ', 33.4484, -112.0740, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_phoenix_2', 'Venue 2', 'Placeholder address — replace before launch', 'Phoenix', 'AZ', 33.4550, -112.0670, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_austin_1', 'Venue 1', 'Placeholder address — replace before launch', 'Austin', 'TX', 30.2672, -97.7431, 'Demo listing. Replace with verified client venue details.', true),
  ('demo_austin_2', 'Venue 2', 'Placeholder address — replace before launch', 'Austin', 'TX', 30.2740, -97.7360, 'Demo listing. Replace with verified client venue details.', true)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  description = excluded.description,
  is_demo = true;
