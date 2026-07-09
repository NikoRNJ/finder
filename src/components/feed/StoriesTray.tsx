import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/storage";
import Avatar from "@/components/ui/Avatar";

type StoryRow = {
  id: string;
  author_id: string;
  created_at: string;
  author: { username: string; avatar_url: string | null };
  views: { viewer_id: string }[];
};

export default async function StoriesTray({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("stories")
    .select(
      `id, author_id, created_at,
       author:profiles!stories_author_id_fkey (username, avatar_url),
       views:story_views (viewer_id)`
    )
    .order("created_at", { ascending: true });

  const stories = (data ?? []) as unknown as StoryRow[];

  // agrupar por autor
  const byAuthor = new Map<
    string,
    { username: string; avatar_url: string | null; allSeen: boolean }
  >();
  for (const s of stories) {
    const seen = s.views.some((v) => v.viewer_id === currentUserId);
    const prev = byAuthor.get(s.author_id);
    byAuthor.set(s.author_id, {
      username: s.author.username,
      avatar_url: s.author.avatar_url,
      allSeen: (prev?.allSeen ?? true) && seen,
    });
  }

  const authors = [...byAuthor.entries()];
  // propias primero
  authors.sort(([a], [b]) =>
    a === currentUserId ? -1 : b === currentUserId ? 1 : 0
  );

  const avatarPaths = authors
    .map(([, v]) => v.avatar_url)
    .filter((p): p is string => !!p);
  const avatarSigned = await signedUrls(supabase, "avatars", [
    ...new Set(avatarPaths),
  ]);

  return (
    <div className="flex gap-4 px-4 py-3 overflow-x-auto border-b border-neutral-800">
      <Link href="/stories/new" className="flex flex-col items-center gap-1 shrink-0">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-600 flex items-center justify-center">
          <span className="text-2xl text-neutral-400">+</span>
        </div>
        <span className="text-xs text-neutral-400">Tu historia</span>
      </Link>

      {authors.map(([authorId, a]) => (
        <Link
          key={authorId}
          href={`/stories/${authorId}`}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div
            className={`p-[2.5px] rounded-full ${
              a.allSeen
                ? "bg-neutral-700"
                : "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600"
            }`}
          >
            <div className="p-[2px] bg-neutral-950 rounded-full">
              <Avatar
                url={a.avatar_url ? avatarSigned.get(a.avatar_url) : null}
                name={a.username}
                size={58}
              />
            </div>
          </div>
          <span className="text-xs text-neutral-300 max-w-16 truncate">
            {authorId === currentUserId ? "Tú" : a.username}
          </span>
        </Link>
      ))}
    </div>
  );
}
