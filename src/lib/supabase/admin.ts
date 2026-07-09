import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con service_role: omite RLS. SOLO usar en route handlers
// tras verificar sesión + is_admin.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
