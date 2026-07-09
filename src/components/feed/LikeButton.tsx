"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LikeButton({
  postId,
  userId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  userId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  async function toggle() {
    const supabase = createClient();
    // optimista
    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));

    if (liked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) {
        setLiked(true);
        setCount((c) => c + 1);
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: userId });
      if (error) {
        setLiked(false);
        setCount((c) => c - 1);
      }
    }
  }

  return (
    <button onClick={toggle} className="flex items-center gap-1.5" aria-label="Me gusta">
      <svg
        viewBox="0 0 24 24"
        className={`w-6 h-6 transition-transform active:scale-125 ${
          liked ? "fill-red-500 stroke-red-500" : "fill-none stroke-current"
        }`}
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21C7 16.5 3 13.3 3 9.5 3 7 5 5 7.5 5c1.7 0 3.4 1 4.5 2.5C13.1 6 14.8 5 16.5 5 19 5 21 7 21 9.5c0 3.8-4 7-9 11.5z"
        />
      </svg>
      <span className="text-sm text-neutral-300">{count}</span>
    </button>
  );
}
