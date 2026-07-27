-- Join-or-create, in one idempotent call.
--
-- Auto-creating a household on first run meant every device made its own and
-- then reported "synced" — to a different household. This lets every device
-- converge on the same one from a code baked into the app, so opening the page
-- anywhere lands on the same data with no join step.
create or replace function public.ensure_household(p_code text, p_name text default 'Our home')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_code text := upper(trim(p_code));
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select h.id into v_id from households h where h.invite_code = v_code;

  if v_id is null then
    -- two devices opening at once must not create two households
    insert into households (name, invite_code)
    values (p_name, v_code)
    on conflict (invite_code) do nothing
    returning households.id into v_id;

    if v_id is null then
      select h.id into v_id from households h where h.invite_code = v_code;
    end if;
  end if;

  insert into household_members (household_id, user_id)
  values (v_id, auth.uid())
  on conflict do nothing;

  return v_id;
end;
$$;

revoke all on function public.ensure_household(text, text) from anon, public;
grant execute on function public.ensure_household(text, text) to authenticated;

notify pgrst, 'reload schema';
