-- 006: stories (24h), story_views, notes (24h)

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);
create index stories_author_idx on public.stories (author_id, created_at desc);

create table public.story_views (
  story_id uuid references public.stories(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 60),
  created_at timestamptz not null default now()
);
create index notes_author_idx on public.notes (author_id, created_at desc);

-- una nota activa por usuario: al insertar, borrar las anteriores
create or replace function public.replace_previous_note()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  delete from public.notes where author_id = new.author_id and id <> new.id;
  return new;
end;
$$;

create trigger notes_replace_previous
  after insert on public.notes
  for each row execute function public.replace_previous_note();

alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.notes enable row level security;

-- historias: solo frescas (<24h) visibles, incluso vía API directa
create policy "stories_select_fresh" on public.stories
  for select to authenticated
  using (created_at > now() - interval '24 hours');
create policy "stories_insert_own" on public.stories
  for insert to authenticated with check (author_id = auth.uid());
create policy "stories_delete_own" on public.stories
  for delete to authenticated using (author_id = auth.uid());

create policy "story_views_select_author_or_own" on public.story_views
  for select to authenticated
  using (
    viewer_id = auth.uid()
    or exists (
      select 1 from public.stories s
      where s.id = story_id and s.author_id = auth.uid()
    )
  );
create policy "story_views_insert_own" on public.story_views
  for insert to authenticated with check (viewer_id = auth.uid());

create policy "notes_select_fresh" on public.notes
  for select to authenticated
  using (created_at > now() - interval '24 hours');
create policy "notes_insert_own" on public.notes
  for insert to authenticated with check (author_id = auth.uid());
create policy "notes_update_own" on public.notes
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "notes_delete_own" on public.notes
  for delete to authenticated using (author_id = auth.uid());
