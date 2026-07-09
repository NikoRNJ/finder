import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminGuard";
import AdminPanel from "@/components/admin/AdminPanel";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/feed");

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, display_name, is_admin, created_at")
    .order("created_at", { ascending: true });

  return (
    <main className="flex-1 p-4">
      <h1 className="text-xl font-bold mb-4">Panel de administración</h1>
      <AdminPanel users={users ?? []} currentUserId={admin.id} />
    </main>
  );
}
