"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CommentForm({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      author_id: userId,
      content: content.trim(),
    });

    if (!error) {
      setContent("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        placeholder="Añade un comentario…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold"
      >
        Publicar
      </button>
    </form>
  );
}
