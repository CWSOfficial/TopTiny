-- The admin-users Edge Function verifies the caller's admin role before it
-- uses its service-role client to read and update profile records.
grant select, update on table public.profiles to service_role;
