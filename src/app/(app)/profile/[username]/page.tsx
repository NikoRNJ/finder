import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedPosts } from "@/lib/feed";
import { signedUrl } from "@/lib/storage";
import Avatar from "@/components/ui/Avatar";
import DmButton from "@/components/chat/DmButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // "me" → perfil propio
  if (username === "me") {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user!.id)
      .single();
    redirect(`/profile/${myProfile!.username}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, is_admin")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const isMe = profile.id === user!.id;
  const posts = await fetchFeedPosts(supabase, user!.id, {
    authorId: profile.id,
    limit: 60,
  });

  const avatarSigned = profile.avatar_url
    ? await signedUrl(supabase, "avatars", profile.avatar_url)
    : null;

  return (
    <main className="flex-1">
      <div className="p-4 flex items-center gap-5">
        <Avatar url={avatarSigned} name={profile.username} size={80} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm text-neutral-400">@{profile.username}</p>
          {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        {isMe ? (
          <>
            <Link
              href="/settings"
              className="flex-1 text-center rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold"
            >
              Editar perfil
            </Link>
            {profile.is_admin && (
              <Link
                href="/admin"
                className="flex-1 text-center rounded-lg border border-amber-700 text-amber-400 px-4 py-2 text-sm font-semibold"
              >
                Administrar
              </Link>
            )}
          </>
        ) : (
          <DmButton otherUserId={profile.id} />
        )}
      </div>

      <div className="border-t border-neutral-800">
        {posts.length === 0 ? (
          <p className="text-center text-neutral-500 text-sm py-16">
            Sin publicaciones todavía
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-px">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`} className="aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageSignedUrl}
                  alt={post.caption ?? ""}
                  className="w-full h-full object-cover bg-neutral-900"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
