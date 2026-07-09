import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import LikeButton from "@/components/feed/LikeButton";
import { timeAgo } from "@/lib/time";

export type FeedPost = {
  id: string;
  caption: string | null;
  created_at: string;
  imageSignedUrl: string;
  author: {
    username: string;
    display_name: string | null;
    avatarSignedUrl: string | null;
  };
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
};

export default function PostCard({
  post,
  userId,
}: {
  post: FeedPost;
  userId: string;
}) {
  return (
    <article className="border-b border-neutral-800 pb-3">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/profile/${post.author.username}`}>
          <Avatar
            url={post.author.avatarSignedUrl}
            name={post.author.username}
            size={36}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${post.author.username}`}
            className="text-sm font-semibold"
          >
            {post.author.username}
          </Link>
          <p className="text-xs text-neutral-500">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.imageSignedUrl}
        alt={post.caption ?? "Publicación"}
        className="w-full max-h-[36rem] object-cover bg-neutral-900"
      />

      <div className="px-4 pt-3 flex items-center gap-4">
        <LikeButton
          postId={post.id}
          userId={userId}
          initialLiked={post.likedByMe}
          initialCount={post.likeCount}
        />
        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 text-neutral-300"
          aria-label="Comentarios"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-3.62-.68L3 21l1.9-3.8A7.6 7.6 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-sm">{post.commentCount}</span>
        </Link>
      </div>

      {post.caption && (
        <p className="px-4 pt-2 text-sm">
          <Link
            href={`/profile/${post.author.username}`}
            className="font-semibold mr-2"
          >
            {post.author.username}
          </Link>
          {post.caption}
        </p>
      )}
    </article>
  );
}
