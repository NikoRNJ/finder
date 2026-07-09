"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();

  async function remove() {
    if (!confirm("¿Eliminar esta publicación?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) {
      router.push("/feed");
      router.refresh();
    }
  }

  return (
    <button onClick={remove} className="text-xs text-red-400 hover:text-red-300">
      Eliminar
    </button>
  );
}
