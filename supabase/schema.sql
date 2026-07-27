-- HomeRanking — Phase 2 schema
-- Paste this whole file into the Supabase SQL editor and run it once.
--
-- Security model: the publishable key is public by design, so every guarantee
-- comes from Row Level Security. Nothing here is readable or writable except
-- by a signed-in user who is a member of the household the row belongs to.

-- ---------------------------------------------------------------- tables ---

create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Our home',
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- One row per person per chore per week. `person` is a column on the shared
-- household, not an identity: either phone can log for either of you, which is
-- what the two tabs in the app mean.
create table if not exists public.entries (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  person       text not null check (person in ('alix', 'david')),
  chore_id     text not null,
  week_start   date not null,
  count        integer not null default 0 check (count >= 0),
  -- Points frozen at log time. Without this, retuning a score in settings
  -- silently rewrites every past week, and the history stops being trustworthy.
  points       integer not null default 0,
  updated_at   timestamptz not null default now(),
  unique (household_id, person, chore_id, week_start)
);

create index if not exists entries_week_idx
  on public.entries (household_id, week_start);

-- for households created before these columns existed
alter table public.entries add column if not exists points integer not null default 0;
alter table public.chores  add column if not exists emoji  text not null default '';

-- The household's own chore list. Points are meaningless unless both phones
-- agree on them, so this cannot live in one device's storage.
create table if not exists public.chores (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  chore_key     text not null,
  name          text not null,
  category      text not null,
  effort        integer not null default 1 check (effort in (1, 3, 5)),
  aversion      integer not null default 1 check (aversion in (1, 3, 5)),
  mental_load   integer not null default 1 check (mental_load in (1, 3, 5)),
  weekly_target numeric not null default 1,
  emoji         text not null default '',
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  unique (household_id, chore_key)
);

-- ------------------------------------------------------------ membership ---

-- SECURITY DEFINER so the policies below can ask "is this user a member?"
-- without the membership check itself needing a policy, which would recurse.
create or replace function public.is_member(h uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = h and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------- policies --

alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.entries           enable row level security;

drop policy if exists households_read on public.households;
create policy households_read on public.households
  for select using (public.is_member(id));

drop policy if exists members_read on public.household_members;
create policy members_read on public.household_members
  for select using (public.is_member(household_id));

alter table public.chores enable row level security;

drop policy if exists chores_read on public.chores;
create policy chores_read on public.chores
  for select using (public.is_member(household_id));

drop policy if exists chores_write on public.chores;
create policy chores_write on public.chores
  for insert with check (public.is_member(household_id));

drop policy if exists chores_update on public.chores;
create policy chores_update on public.chores
  for update using (public.is_member(household_id))
  with check (public.is_member(household_id));

drop policy if exists chores_delete on public.chores;
create policy chores_delete on public.chores
  for delete using (public.is_member(household_id));

drop policy if exists entries_read on public.entries;
create policy entries_read on public.entries
  for select using (public.is_member(household_id));

drop policy if exists entries_write on public.entries;
create policy entries_write on public.entries
  for insert with check (public.is_member(household_id));

drop policy if exists entries_update on public.entries;
create policy entries_update on public.entries
  for update using (public.is_member(household_id))
  with check (public.is_member(household_id));

drop policy if exists entries_delete on public.entries;
create policy entries_delete on public.entries
  for delete using (public.is_member(household_id));

-- There is deliberately no INSERT policy on households or household_members.
-- Both are created only through the two functions below, so a household can
-- never be joined by anyone who does not hold its invite code.

-- --------------------------------------------------------------- functions --

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

  -- 8 chars from an alphabet with no 0/O/1/I, so a code can be read aloud
  loop
    v_code := upper(
      translate(substr(encode(gen_random_bytes(8), 'base64'), 1, 8), '+/=OI01lo', 'XYZWJKMNP')
    );
    exit when not exists (select 1 from households h where h.invite_code = v_code);
  end loop;

  insert into households (name, invite_code) values (p_name, v_code)
  returning households.id into v_id;

  insert into household_members (household_id, user_id) values (v_id, auth.uid());

  return query select v_id, v_code;
end;
$$;

create or replace function public.join_household(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select h.id into v_id from households h
  where h.invite_code = upper(trim(p_code));

  if v_id is null then
    raise exception 'no household with that code';
  end if;

  insert into household_members (household_id, user_id)
  values (v_id, auth.uid())
  on conflict do nothing;

  return v_id;
end;
$$;

revoke all on function public.create_household(text) from public;
revoke all on function public.join_household(text) from public;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text)   to authenticated;

-- ---------------------------------------------------------------- realtime --

alter table public.entries replica identity full;

alter table public.chores replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.entries;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.chores;
exception
  when duplicate_object then null;
end $$;

-- Supabase caches the schema, so new tables and functions stay invisible to
-- the API until it is told to look again. Safe to run any number of times.
notify pgrst, 'reload schema';
