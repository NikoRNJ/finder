import type { SupabaseClient } from "@supabase/supabase-js";
import { signedUrls } from "@/lib/storage";
import type { FeedPost } from "@/components/feed/PostCard";

type PostRow = {
  id: string;
  caption: string | null;
  image_url: string;
  created_at: string;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes: { user_id: string }[];
  comments: { count: number }[];
};

export async function fetchFeedPosts(
  supabase: SupabaseClient,
  userId: string,
  opts: { authorId?: string; limit?: number; before?: string } = {}
): Promise<FeedPost[]> {
  let query = supabase
    .from("posts")
    .select(
      `id, caption, image_url, created_at,
       author:profiles!posts_author_id_fkey (username, display_name, avatar_url),
       likes:post_likes (user_id),
       comments:post_comments (count)`
    )
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 20);

  if (opts.authorId) query = query.eq("author_id", opts.authorId);
  if (opts.before) query = query.lt("created_at", opts.before);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as PostRow[];

  const imageUrls = await signedUrls(
    supabase,
    "posts",
    rows.map((r) => r.image_url)
  );
  const avatarPaths = rows
    .map((r) => r.author.avatar_url)
    .filter((p): p is string => !!p);
  const avatarUrls = await signedUrls(supabase, "avatars", [
    ...new Set(avatarPaths),
  ]);

  return rows.map((r) => ({
    id: r.id,
    caption: r.caption,
    created_at: r.created_at,
    imageSignedUrl: imageUrls.get(r.image_url) ?? "",
    author: {
      username: r.author.username,
      display_name: r.author.display_name,
      avatarSignedUrl: r.author.avatar_url
        ? avatarUrls.get(r.author.avatar_url) ?? null
        : null,
    },
    likeCount: r.likes.length,
    likedByMe: r.likes.some((l) => l.user_id === userId),
    commentCount: r.comments[0]?.count ?? 0,
  }));
}
