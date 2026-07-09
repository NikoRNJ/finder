import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedUrl, signedUrls } from "@/lib/storage";
import Avatar from "@/components/ui/Avatar";
import LikeButton from "@/components/feed/LikeButton";
import CommentForm from "@/components/feed/CommentForm";
import DeletePostButton from "@/components/feed/DeletePostButton";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
    avatar_url: string | null;
  };
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select(
      `id, caption, image_url, created_at, author_id,
       author:profiles!posts_author_id_fkey (username, display_name, avatar_url),
       likes:post_likes (user_id)`
    )
    .eq("id", id)
    .single();

  if (!post) notFound();

  const author = post.author as unknown as {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  const likes = post.likes as { user_id: string }[];

  const { data: commentsData } = await supabase
    .from("post_comments")
    .select(
      `id, content, created_at,
       author:profiles!post_comments_author_id_fkey (username, avatar_url)`
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const comments = (commentsData ?? []) as unknown as CommentRow[];

  const imageUrl = await signedUrl(supabase, "posts", post.image_url);
  const avatarPaths = [
    author.avatar_url,
    ...comments.map((c) => c.author.avatar_url),
  ].filter((p): p is string => !!p);
  const avatarUrls = await signedUrls(supabase, "avatars", [
    ...new Set(avatarPaths),
  ]);

  const isOwner = user!.id === post.author_id;

  return (
    <main className="flex-1">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
        <Link href={`/profile/${author.username}`}>
          <Avatar
            url={author.avatar_url ? avatarUrls.get(author.avatar_url) : null}
            name={author.username}
            size={36}
          />
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${author.username}`} className="text-sm font-semibold">
            {author.username}
          </Link>
          <p className="text-xs text-neutral-500">{timeAgo(post.created_at)}</p>
        </div>
        {isOwner && <DeletePostButton postId={post.id} />}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={post.caption ?? "Publicación"} className="w-full max-h-[36rem] object-cover bg-neutral-900" />

      <div className="px-4 pt-3 flex items-center gap-4">
        <LikeButton
          postId={post.id}
          userId={user!.id}
          initialLiked={likes.some((l) => l.user_id === user!.id)}
          initialCount={likes.length}
        />
      </div>

      {post.caption && (
        <p className="px-4 pt-2 text-sm">
          <span className="font-semibold mr-2">{author.username}</span>
          {post.caption}
        </p>
      )}

      <section className="px-4 py-4 space-y-4 pb-28">
        <h2 className="text-sm font-semibold text-neutral-400">
          Comentarios ({comments.length})
        </h2>
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar
              url={c.author.avatar_url ? avatarUrls.get(c.author.avatar_url) : null}
              name={c.author.username}
              size={32}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <Link href={`/profile/${c.author.username}`} className="font-semibold mr-2">
                  {c.author.username}
                </Link>
                {c.content}
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">{timeAgo(c.created_at)}</p>
            </div>
          </div>
        ))}
        <CommentForm postId={post.id} userId={user!.id} />
      </section>
    </main>
  );
}
