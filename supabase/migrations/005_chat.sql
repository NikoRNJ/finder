-- 005: conversations, members, messages + realtime

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text check (char_length(name) <= 60),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text check (content is null or char_length(content) between 1 and 4000),
  image_url text,
  created_at timestamptz not null default now(),
  check (content is not null or image_url is not null)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

-- membership check without recursive RLS
create or replace function public.is_member(cid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists(
    select 1 from public.conversation_members
    where conversation_id = cid and user_id = auth.uid()
  )
$$;

-- atomic DM find-or-create
create or replace function public.get_or_create_dm(other_user uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv uuid;
begin
  if me is null then
    raise exception 'Sin sesión';
  end if;
  if other_user = me then
    raise exception 'No puedes abrir un chat contigo mismo';
  end if;
  if not exists (select 1 from public.profiles where id = other_user) then
    raise exception 'Usuario no existe';
  end if;

  select c.id into conv
  from public.conversations c
  join public.conversation_members m1 on m1.conversation_id = c.id and m1.user_id = me
  join public.conversation_members m2 on m2.conversation_id = c.id and m2.user_id = other_user
  where c.is_group = false
  limit 1;

  if conv is not null then
    return conv;
  end if;

  insert into public.conversations (is_group, created_by)
  values (false, me)
  returning id into conv;

  insert into public.conversation_members (conversation_id, user_id)
  values (conv, me), (conv, other_user);

  return conv;
end;
$$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select_member" on public.conversations
  for select to authenticated using (public.is_member(id));
create policy "conversations_insert_own" on public.conversations
  for insert to authenticated with check (created_by = auth.uid());
create policy "conversations_update_creator" on public.conversations
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "conversations_delete_creator_or_admin" on public.conversations
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

create policy "members_select_member" on public.conversation_members
  for select to authenticated using (public.is_member(conversation_id));
create policy "members_insert_creator" on public.conversation_members
  for insert to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid() and c.is_group = true
    )
  );
create policy "members_delete_self_or_creator" on public.conversation_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

create policy "messages_select_member" on public.messages
  for select to authenticated using (public.is_member(conversation_id));
create policy "messages_insert_member" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_member(conversation_id));
create policy "messages_delete_own" on public.messages
  for delete to authenticated using (sender_id = auth.uid());

alter publication supabase_realtime add table public.messages;
