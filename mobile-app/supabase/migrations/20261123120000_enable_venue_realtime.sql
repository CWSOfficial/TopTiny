-- Keep the public venue directory in sync with Supabase Realtime subscribers.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'venues'
  ) then
    execute 'alter publication supabase_realtime add table public.venues';
  end if;
end;
$$;
