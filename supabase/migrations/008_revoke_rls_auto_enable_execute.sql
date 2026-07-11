-- rls_auto_enable() es un helper interno (event trigger); no debe ser
-- invocable vía /rest/v1/rpc por anon ni authenticated.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
