-- allow is_admin changes from service contexts (auth.uid() is null) or admins
create or replace function public.protect_is_admin()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'No autorizado para cambiar is_admin';
  end if;
  return new;
end;
$$;
