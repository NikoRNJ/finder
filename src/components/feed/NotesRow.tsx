import { createClient } from "@/lib/supabase/server";
import NoteComposer from "@/components/feed/NoteComposer";

type NoteRow = {
  id: string;
  content: string;
  author_id: string;
  author: { username: string };
};

export default async function NotesRow({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notes")
    .select("id, content, author_id, author:profiles!notes_author_id_fkey (username)")
    .order("created_at", { ascending: false });

  const notes = (data ?? []) as unknown as NoteRow[];
  const myNote = notes.find((n) => n.author_id === currentUserId);
  const otherNotes = notes.filter((n) => n.author_id !== currentUserId);

  return (
    <div className="flex gap-3 px-4 py-2.5 overflow-x-auto border-b border-neutral-800 items-start">
      <NoteComposer existingNote={myNote?.content ?? null} />
      {otherNotes.map((n) => (
        <div key={n.id} className="shrink-0 max-w-36">
          <div className="bg-neutral-800 rounded-2xl rounded-bl-sm px-3 py-2">
            <p className="text-xs break-words">{n.content}</p>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 px-1 truncate">
            @{n.author.username}
          </p>
        </div>
      ))}
    </div>
  );
}
