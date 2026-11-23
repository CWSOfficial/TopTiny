-- Run only in the TopTini Supabase SQL Editor as the project owner.
-- Run after admin@yopmail.com has signed up in the new TopTini Supabase project.
do $$
declare
  admin_email text := 'admin@yopmail.com';
begin
  insert into public.profiles (id, username, preferred_city)
  select
    u.id,
    left(coalesce(nullif(u.raw_user_meta_data ->> 'username', ''), split_part(u.email, '@', 1), 'TopTini admin'), 30),
    'Milwaukee'
  from auth.users u
  where lower(u.email) = lower(admin_email)
  on conflict (id) do nothing;

  update public.profiles p
  set is_admin = true
  from auth.users u
  where p.id = u.id
    and lower(u.email) = lower(admin_email);

  if not found then
    raise exception 'No Auth user found for %. Sign in to TopTini once so a profile is created, then run this script again.', admin_email;
  end if;
end;
$$;
