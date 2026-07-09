import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatThread from "@/components/chat/ChatThread";

export const dynamic = "force-dynamic";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS garantiza que solo miembros ven la conversación
  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      `id, is_group, name,
       members:conversation_members (
         user_id,
         profile:profiles (username, display_name, avatar_url)
       )`
    )
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  const members = conversation.members as unknown as {
    user_id: string;
    profile: { username: string; display_name: string | null; avatar_url: string | null };
  }[];

  const others = members.filter((m) => m.user_id !== user!.id);
  const title = conversation.is_group
    ? conversation.name ?? "Grupo"
    : others[0]?.profile.display_name || others[0]?.profile.username || "Chat";

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("id, sender_id, content, image_url, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  const senderNames = new Map(
    members.map((m) => [m.user_id, m.profile.username])
  );

  return (
    <ChatThread
      conversationId={conversationId}
      userId={user!.id}
      title={title}
      isGroup={conversation.is_group}
      memberCount={members.length}
      senderNames={Object.fromEntries(senderNames)}
      initialMessages={initialMessages ?? []}
    />
  );
}
