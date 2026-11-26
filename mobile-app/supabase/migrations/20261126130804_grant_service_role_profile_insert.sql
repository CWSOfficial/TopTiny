-- The admin-users Edge Function may create a basic profile when granting
-- admin access to an Auth account that has no profile row yet.
grant insert on table public.profiles to service_role;
