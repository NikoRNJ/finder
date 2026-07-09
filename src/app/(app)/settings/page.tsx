import { createClient } from "@/lib/supabase/server";
import { signedUrl } from "@/lib/storage";
import SettingsForm from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, bio")
    .eq("id", user!.id)
    .single();

  const avatarSigned = profile?.avatar_url
    ? await signedUrl(supabase, "avatars", profile.avatar_url)
    : null;

  return (
    <main className="flex-1 p-4">
      <h1 className="text-xl font-bold mb-4">Ajustes</h1>
      <SettingsForm
        userId={user!.id}
        username={profile!.username}
        displayName={profile!.display_name ?? ""}
        bio={profile!.bio ?? ""}
        avatarUrl={avatarSigned}
      />
    </main>
  );
}
