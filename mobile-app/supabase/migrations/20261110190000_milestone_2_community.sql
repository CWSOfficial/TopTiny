-- TopTini Milestone 2: community ratings, user submissions, favorites,
-- moderation, and city leaderboards.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Keep privilege assignment out of the user-editable profile fields.
revoke all on table public.profiles from anon, authenticated;
grant select (id, username, preferred_city, avatar_path, is_admin, created_at)
  on table public.profiles to authenticated;
grant insert (id, username, preferred_city)
  on table public.profiles to authenticated;
grant update (username, preferred_city, avatar_path)
  on table public.profiles to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin is true
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create table if not exists public.cities (
  name text primary key check (char_length(btrim(name)) between 2 and 80),
  state text not null check (char_length(state) between 2 and 3),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cities enable row level security;
revoke all on table public.cities from anon, authenticated;
grant select on table public.cities to anon, authenticated;
grant insert, update, delete on table public.cities to authenticated;
drop policy if exists "Active city guides are public" on public.cities;
create policy "Active city guides are public"
  on public.cities for select to anon, authenticated
  using (is_active);
drop policy if exists "TopTini admins can read all cities" on public.cities;
create policy "TopTini admins can read all cities"
  on public.cities for select to authenticated
  using ((select private.is_admin()));
drop policy if exists "TopTini admins manage cities" on public.cities;
create policy "TopTini admins manage cities"
  on public.cities for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
insert into public.cities (name, state, latitude, longitude)
values
  ('Milwaukee', 'WI', 43.0389, -87.9065),
  ('Chicago', 'IL', 41.8781, -87.6298),
  ('Phoenix', 'AZ', 33.4484, -112.0740),
  ('Austin', 'TX', 30.2672, -97.7431)
on conflict (name) do update set
  state = excluded.state, latitude = excluded.latitude,
  longitude = excluded.longitude, is_active = true, updated_at = now();

alter table public.profiles drop constraint if exists profiles_preferred_city_check;
alter table public.venues drop constraint if exists venues_city_check;
alter table public.profiles drop constraint if exists profiles_preferred_city_fkey;
alter table public.venues drop constraint if exists venues_city_fkey;
alter table public.profiles add constraint profiles_preferred_city_fkey
  foreign key (preferred_city) references public.cities (name)
  on update cascade on delete restrict;
alter table public.venues add constraint venues_city_fkey
  foreign key (city) references public.cities (name)
  on update cascade on delete restrict;

alter table public.venues
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists espresso_martini_verified boolean not null default false,
  add column if not exists verification_source text,
  add column if not exists verified_at timestamptz;

alter table public.venues
  drop constraint if exists venues_espresso_martini_verification_check;
alter table public.venues
  add constraint venues_espresso_martini_verification_check
  check (
    is_demo
    or (
      not espresso_martini_verified
      or nullif(btrim(verification_source), '') ~* '^https?://'
    )
  );

create index if not exists venues_city_address_idx
  on public.venues (city, lower(btrim(address)));

revoke all on table public.venues from anon, authenticated;
grant select on table public.venues to anon, authenticated;
grant insert, update, delete on table public.venues to authenticated;

drop policy if exists "TopTini admins manage venues" on public.venues;
create policy "TopTini admins manage venues"
  on public.venues for all to authenticated
  using ((select private.is_admin()))
  with check (
    (select private.is_admin())
    and (
      is_demo
      or (espresso_martini_verified and nullif(btrim(verification_source), '') is not null)
    )
  );

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  venue_id text not null references public.venues (id) on delete cascade,
  rating numeric(3,1) not null check (rating between 0 and 10),
  body text not null default '' check (char_length(body) <= 1500),
  photo_path text,
  author_name text not null default 'TopTini member',
  status text not null default 'published'
    check (status in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_one_per_user_venue unique (user_id, venue_id)
);

create index if not exists reviews_venue_status_created_idx
  on public.reviews (venue_id, status, created_at desc);
create index if not exists reviews_user_created_idx
  on public.reviews (user_id, created_at desc);

alter table public.reviews enable row level security;
revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant insert (user_id, venue_id, rating, body, photo_path, author_name)
  on table public.reviews to authenticated;
grant update (rating, body, photo_path, status, updated_at)
  on table public.reviews to authenticated;
grant delete on table public.reviews to authenticated;

drop policy if exists "Published reviews are public" on public.reviews;
create policy "Published reviews are public"
  on public.reviews for select to anon, authenticated
  using (status = 'published');
drop policy if exists "Members can read their own reviews" on public.reviews;
create policy "Members can read their own reviews"
  on public.reviews for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Members can create their own review" on public.reviews;
create policy "Members can create their own review"
  on public.reviews for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'published'
  );
drop policy if exists "Members can update their own review" on public.reviews;
create policy "Members can update their own review"
  on public.reviews for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and status = 'published'
  );
drop policy if exists "Members can delete their own review" on public.reviews;
create policy "Members can delete their own review"
  on public.reviews for delete to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "TopTini admins moderate reviews" on public.reviews;
create policy "TopTini admins moderate reviews"
  on public.reviews for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create or replace function private.set_review_author_name()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and new.user_id = (select auth.uid()) then
    select coalesce(nullif(btrim(p.username), ''), 'TopTini member')
      into new.author_name
      from public.profiles p
      where p.id = new.user_id;
    new.author_name := coalesce(new.author_name, 'TopTini member');
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.set_review_author_name() from public, anon, authenticated;
grant execute on function private.set_review_author_name() to authenticated;
drop trigger if exists set_review_author_name on public.reviews;
create trigger set_review_author_name
  before insert or update of rating, body, photo_path on public.reviews
  for each row execute function private.set_review_author_name();

create or replace view public.venue_score_summary
with (security_invoker = true)
as
  select
    v.id as venue_id,
    count(r.id)::integer as review_count,
    coalesce(round(avg(r.rating)::numeric, 1), 0)::numeric(3,1) as average_score
  from public.venues v
  left join public.reviews r
    on r.venue_id = v.id and r.status = 'published'
  group by v.id;
grant select on public.venue_score_summary to anon, authenticated;

create or replace view public.city_leaderboards
with (security_invoker = true)
as
  with city_averages as (
    select v.city, avg(r.rating) as city_average
    from public.venues v
    join public.reviews r on r.venue_id = v.id and r.status = 'published'
    group by v.city
  ), venue_scores as (
    select v.id as venue_id, v.name, v.city, v.state, v.address, v.photo_url,
      count(r.id)::integer as review_count,
      avg(r.rating)::numeric as average_score,
      coalesce(ca.city_average, 0)::numeric as city_average
    from public.venues v
    left join public.reviews r
      on r.venue_id = v.id and r.status = 'published'
    left join city_averages ca on ca.city = v.city
    group by v.id, ca.city_average
  )
  select venue_id, name, city, state, address, photo_url, review_count,
    round(average_score, 1)::numeric(3,1) as average_score,
    round(((review_count::numeric / (review_count + 5)) * average_score)
      + ((5::numeric / (review_count + 5)) * city_average), 3) as ranking_score,
    row_number() over (
      partition by city
      order by
        ((review_count::numeric / (review_count + 5)) * average_score)
          + ((5::numeric / (review_count + 5)) * city_average) desc,
        review_count desc,
        name asc
    )::integer as city_rank
  from venue_scores
  where review_count > 0;
grant select on public.city_leaderboards to anon, authenticated;

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  venue_id text not null references public.venues (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_id)
);
alter table public.favorites enable row level security;
revoke all on table public.favorites from anon, authenticated;
grant select, insert, delete on table public.favorites to authenticated;
drop policy if exists "Members manage their own favorites" on public.favorites;
create policy "Members manage their own favorites"
  on public.favorites for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.venue_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  address text not null check (char_length(btrim(address)) between 5 and 240),
  city text not null check (city in ('Milwaukee', 'Chicago', 'Phoenix', 'Austin')),
  state text not null check (char_length(state) between 2 and 3),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  phone text check (phone is null or char_length(phone) <= 40),
  website text check (website is null or char_length(website) <= 240),
  note text check (note is null or char_length(note) <= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'duplicate')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.venue_submissions drop constraint if exists venue_submissions_city_check;
alter table public.venue_submissions drop constraint if exists venue_submissions_city_fkey;
alter table public.venue_submissions add constraint venue_submissions_city_fkey
  foreign key (city) references public.cities (name)
  on update cascade on delete restrict;
create index if not exists venue_submissions_status_created_idx
  on public.venue_submissions (status, created_at desc);
create index if not exists venue_submissions_user_created_idx
  on public.venue_submissions (user_id, created_at desc);
drop index if exists public.venue_submissions_no_active_duplicates_idx;
create unique index venue_submissions_no_active_duplicates_idx
  on public.venue_submissions (
    city,
    lower(regexp_replace(btrim(name), '\s+', ' ', 'g')),
    lower(regexp_replace(btrim(address), '\s+', ' ', 'g'))
  ) where status in ('pending', 'approved');
drop index if exists public.venues_city_name_address_unique_idx;
create unique index venues_city_name_address_unique_idx
  on public.venues (
    city,
    lower(regexp_replace(btrim(name), '\s+', ' ', 'g')),
    lower(regexp_replace(btrim(address), '\s+', ' ', 'g'))
  );

create or replace function private.prevent_duplicate_venue_submission()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.venues v
    where v.city = new.city
      and lower(regexp_replace(btrim(v.name), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(new.name), '\s+', ' ', 'g'))
      and lower(regexp_replace(btrim(v.address), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(new.address), '\s+', ' ', 'g'))
  ) then
    raise exception 'This venue is already in the guide.' using errcode = '23505';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_duplicate_venue_submission() from public, anon, authenticated;
grant execute on function private.prevent_duplicate_venue_submission() to authenticated;
drop trigger if exists prevent_duplicate_venue_submission on public.venue_submissions;
create trigger prevent_duplicate_venue_submission
  before insert or update of name, address, city on public.venue_submissions
  for each row execute function private.prevent_duplicate_venue_submission();

alter table public.venue_submissions enable row level security;
revoke all on table public.venue_submissions from anon, authenticated;
grant select, insert on table public.venue_submissions to authenticated;
grant update, delete on table public.venue_submissions to authenticated;
drop policy if exists "Members can submit venues and see their status" on public.venue_submissions;
create policy "Members can submit venues and see their status"
  on public.venue_submissions for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Members can submit a venue for review" on public.venue_submissions;
create policy "Members can submit a venue for review"
  on public.venue_submissions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
  );
drop policy if exists "TopTini admins manage venue submissions" on public.venue_submissions;
create policy "TopTini admins manage venue submissions"
  on public.venue_submissions for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create or replace function public.approve_venue_submission(
  submission_id uuid,
  venue_latitude double precision,
  venue_longitude double precision,
  venue_description text default null,
  espresso_martini_source text default null
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request public.venue_submissions%rowtype;
  new_venue_id text;
begin
  if not private.is_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  if venue_latitude is null or venue_longitude is null
    or venue_latitude not between -90 and 90
    or venue_longitude not between -180 and 180 then
    raise exception 'A valid venue map location is required.' using errcode = '22023';
  end if;
  if nullif(btrim(espresso_martini_source), '') is null then
    raise exception 'Add a menu or venue URL confirming espresso martinis are served.' using errcode = '22023';
  end if;
  if btrim(espresso_martini_source) !~* '^https?://' then
    raise exception 'The espresso martini source must be an HTTP or HTTPS URL.' using errcode = '22023';
  end if;

  select * into request
    from public.venue_submissions
    where id = submission_id and status = 'pending'
    for update;
  if not found then
    raise exception 'Pending venue submission not found.' using errcode = 'P0002';
  end if;

  insert into public.venues (
    id, name, address, city, state, latitude, longitude,
    phone, website, description, is_demo, espresso_martini_verified,
    verification_source, verified_at
  ) values (
    gen_random_uuid()::text, btrim(request.name), btrim(request.address),
    request.city, request.state, venue_latitude, venue_longitude,
    nullif(btrim(request.phone), ''), nullif(btrim(request.website), ''),
    coalesce(nullif(btrim(venue_description), ''), nullif(btrim(request.note), '')),
    false, true, btrim(espresso_martini_source), now()
  ) returning id into new_venue_id;

  update public.venue_submissions
    set status = 'approved', updated_at = now(), admin_note = null
    where id = request.id;
  return new_venue_id;
end;
$$;
revoke all on function public.approve_venue_submission(uuid, double precision, double precision, text, text)
  from public, anon;
grant execute on function public.approve_venue_submission(uuid, double precision, double precision, text, text)
  to authenticated;

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  review_id uuid not null references public.reviews (id) on delete cascade,
  reason text not null check (reason in ('spam', 'abuse', 'wrong_venue', 'photo', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporter_id, review_id)
);
create index if not exists review_reports_status_created_idx
  on public.review_reports (status, created_at desc);
alter table public.review_reports enable row level security;
revoke all on table public.review_reports from anon, authenticated;
grant select, insert on table public.review_reports to authenticated;
grant update, delete on table public.review_reports to authenticated;
drop policy if exists "Members can report a review once" on public.review_reports;
create policy "Members can report a review once"
  on public.review_reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id and status = 'open');
drop policy if exists "Members can see their reports" on public.review_reports;
create policy "Members can see their reports"
  on public.review_reports for select to authenticated
  using ((select auth.uid()) = reporter_id);
drop policy if exists "TopTini admins manage review reports" on public.review_reports;
create policy "TopTini admins manage review reports"
  on public.review_reports for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('review-photos', 'review-photos', true, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('venue-photos', 'venue-photos', true, 10485760,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Review photos are public" on storage.objects;
create policy "Review photos are public"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'review-photos');
drop policy if exists "Members upload their review photos" on storage.objects;
create policy "Members upload their review photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Members delete their review photos" on storage.objects;
create policy "Members delete their review photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "TopTini admins delete review photos" on storage.objects;
create policy "TopTini admins delete review photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'review-photos' and (select private.is_admin()));
drop policy if exists "Venue photos are public" on storage.objects;
create policy "Venue photos are public"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'venue-photos');
drop policy if exists "TopTini admins upload venue photos" on storage.objects;
create policy "TopTini admins upload venue photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'venue-photos'
    and (select private.is_admin())
  );
drop policy if exists "TopTini admins update venue photos" on storage.objects;
create policy "TopTini admins update venue photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'venue-photos' and (select private.is_admin()))
  with check (bucket_id = 'venue-photos' and (select private.is_admin()));
drop policy if exists "TopTini admins delete venue photos" on storage.objects;
create policy "TopTini admins delete venue photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'venue-photos' and (select private.is_admin()));

-- Admin profile access is private to authenticated administrators.
drop policy if exists "TopTini admins can read profiles" on public.profiles;
create policy "TopTini admins can read profiles"
  on public.profiles for select to authenticated
  using ((select private.is_admin()));
