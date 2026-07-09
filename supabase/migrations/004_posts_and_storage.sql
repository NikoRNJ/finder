-- 004: posts, likes, comments + storage buckets

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text check (char_length(caption) <= 2200),
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);

create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

create policy "posts_select" on public.posts for select to authenticated using (true);
create policy "posts_insert_own" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "posts_update_own" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts_delete_own_or_admin" on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "post_likes_select" on public.post_likes for select to authenticated using (true);
create policy "post_likes_insert_own" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "post_likes_delete_own" on public.post_likes for delete to authenticated using (user_id = auth.uid());

create policy "post_comments_select" on public.post_comments for select to authenticated using (true);
create policy "post_comments_insert_own" on public.post_comments for insert to authenticated with check (author_id = auth.uid());
create policy "post_comments_delete_own_or_admin" on public.post_comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- storage buckets (private)
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', false),
  ('posts', 'posts', false),
  ('stories', 'stories', false),
  ('chat-media', 'chat-media', false);

-- storage policies: upload only to own folder, read for any authenticated member
create policy "storage_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars','posts','stories','chat-media')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_select_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id in ('avatars','posts','stories','chat-media'));

create policy "storage_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars','posts','stories','chat-media')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
