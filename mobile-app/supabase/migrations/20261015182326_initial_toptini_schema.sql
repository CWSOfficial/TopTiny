-- TopTini Milestone 1 schema for Supabase Auth and venue discovery.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (char_length(btrim(username)) between 2 and 30),
  preferred_city text not null default 'Milwaukee'
    check (preferred_city in ('Milwaukee', 'Chicago', 'Phoenix', 'Austin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venues (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(btrim(name)) > 0),
  address text not null check (char_length(btrim(address)) > 0),
  city text not null check (city in ('Milwaukee', 'Chicago', 'Phoenix', 'Austin')),
  state text not null check (char_length(state) between 2 and 3),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  price_level smallint check (price_level between 1 and 4),
  photo_url text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists venues_city_name_idx on public.venues (city, name);

alter table public.profiles enable row level security;
alter table public.venues enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on table public.venues from anon, authenticated;
grant select on table public.venues to anon, authenticated;

drop policy if exists "Venue guide is publicly readable" on public.venues;
create policy "Venue guide is publicly readable"
  on public.venues for select to anon, authenticated
  using (true);

-- The Supabase project was created with automatic RLS enabled. Keep its
-- event-trigger helper private while leaving the trigger itself operational.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
