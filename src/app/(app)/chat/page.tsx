import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/storage";
import Avatar from "@/components/ui/Avatar";
import NewGroupButton from "@/components/chat/NewGroupButton";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

type ConvRow = {
  conversation: {
    id: string;
    is_group: boolean;
    name: string | null;
    members: {
      user_id: string;
      profile: { username: string; display_name: string | null; avatar_url: string | null };
    }[];
    messages: { content: string | null; image_url: string | null; created_at: string }[];
  };
};

export default async function ChatListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("conversation_members")
    .select(
      `conversation:conversations (
        id, is_group, name,
        members:conversation_members (
          user_id,
          profile:profiles (username, display_name, avatar_url)
        ),
        messages (content, image_url, created_at)
      )`
    )
    .eq("user_id", user!.id)
    .order("created_at", {
      referencedTable: "conversations.messages",
      ascending: false,
    })
    .limit(1, { referencedTable: "conversations.messages" });

  const rows = (data ?? []) as unknown as ConvRow[];

  // ordenar por último mensaje
  rows.sort((a, b) => {
    const ta = a.conversation.messages[0]?.created_at ?? "";
    const tb = b.conversation.messages[0]?.created_at ?? "";
    return tb.localeCompare(ta);
  });

  const avatarPaths = rows
    .flatMap((r) => r.conversation.members)
    .filter((m) => m.user_id !== user!.id)
    .map((m) => m.profile.avatar_url)
    .filter((p): p is string => !!p);
  const avatarUrls = await signedUrls(supabase, "avatars", [...new Set(avatarPaths)]);

  // todos los usuarios para crear grupos
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, username")
    .neq("id", user!.id)
    .order("username");

  return (
    <main className="flex-1">
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Chats</h1>
        <NewGroupButton users={allUsers ?? []} />
      </header>

      {rows.length === 0 ? (
        <div className="text-center py-24 px-8">
          <p className="text-neutral-400 font-medium">Sin conversaciones</p>
          <p className="text-neutral-600 text-sm mt-1">
            Busca a alguien y envíale un mensaje, o crea un grupo.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-800/60">
          {rows.map(({ conversation: c }) => {
            const others = c.members.filter((m) => m.user_id !== user!.id);
            const title = c.is_group
              ? c.name ?? "Grupo"
              : others[0]?.profile.display_name || others[0]?.profile.username || "Chat";
            const avatarPath = c.is_group ? null : others[0]?.profile.avatar_url;
            const last = c.messages[0];

            return (
              <li key={c.id}>
                <Link href={`/chat/${c.id}`} className="flex items-center gap-3 px-4 py-3">
                  {c.is_group ? (
                    <div className="w-11 h-11 rounded-full bg-neutral-700 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-neutral-300" strokeWidth="2">
                        <circle cx="9" cy="8" r="3" />
                        <circle cx="16" cy="9" r="2.5" />
                        <path strokeLinecap="round" d="M3 19c0-3 2.7-4.5 6-4.5s6 1.5 6 4.5M15.5 14.7c2.6.3 5 1.7 5 4.3" />
                      </svg>
                    </div>
                  ) : (
                    <Avatar
                      url={avatarPath ? avatarUrls.get(avatarPath) : null}
                      name={title}
                      size={44}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{title}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {last
                        ? last.content ?? "📷 Foto"
                        : "Sin mensajes todavía"}
                    </p>
                  </div>
                  {last && (
                    <span className="text-xs text-neutral-600 shrink-0">
                      {timeAgo(last.created_at)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
