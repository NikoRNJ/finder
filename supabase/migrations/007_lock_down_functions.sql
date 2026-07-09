-- 007: restrict EXECUTE on SECURITY DEFINER functions

-- trigger functions: nobody should call them via RPC
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_is_admin() from public, anon, authenticated;
revoke execute on function public.replace_previous_note() from public, anon, authenticated;

-- helpers used inside RLS policies: authenticated needs EXECUTE, anon does not
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_member(uuid) from public, anon;

-- RPC called from the client: authenticated only
revoke execute on function public.get_or_create_dm(uuid) from public, anon;

-- future functions: don't grant to public by default
alter default privileges in schema public revoke execute on functions from public, anon;
