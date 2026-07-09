-- Defense in depth: only @finder.local accounts may exist.
-- GoTrue's public signup rejects .local domains as invalid email,
-- so the ONLY way to create an account is the admin API / service_role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.email is null or new.email not like '%@finder.local' then
    raise exception 'Registro no permitido';
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
