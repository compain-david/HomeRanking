-- One fix: the invite-code generator used gen_random_bytes(), which lives in
-- the pgcrypto extension. Supabase does not enable it, so creating a household
-- raised an error every single time. gen_random_uuid() is core Postgres.
create or replace function public.create_household(p_name text default 'Our home')
returns table (id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from households h where h.invite_code = v_code);
  end loop;

  insert into households (name, invite_code) values (p_name, v_code)
  returning households.id into v_id;

  insert into household_members (household_id, user_id) values (v_id, auth.uid());

  return query select v_id, v_code;
end;
$$;

revoke all on function public.create_household(text) from anon, public;
grant execute on function public.create_household(text) to authenticated;

notify pgrst, 'reload schema';
