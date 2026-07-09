import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedPosts } from "@/lib/feed";
import PostCard from "@/components/feed/PostCard";
import StoriesTray from "@/components/feed/StoriesTray";
import NotesRow from "@/components/feed/NotesRow";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const posts = await fetchFeedPosts(supabase, user!.id);

  return (
    <main className="flex-1">
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Finder</h1>
        <Link href="/settings" aria-label="Ajustes" className="text-neutral-400">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path
              strokeLinecap="round"
              d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34h.09a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55h.09a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v.09a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z"
            />
          </svg>
        </Link>
      </header>

      <StoriesTray currentUserId={user!.id} />
      <NotesRow currentUserId={user!.id} />

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <p className="text-neutral-400 font-medium">Aún no hay publicaciones</p>
          <p className="text-neutral-600 text-sm mt-1">
            Sé el primero en compartir algo con el círculo.
          </p>
          <Link
            href="/post/new"
            className="mt-4 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold"
          >
            Crear publicación
          </Link>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} userId={user!.id} />
          ))}
        </div>
      )}
    </main>
  );
}
