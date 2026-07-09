"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DmButton({ otherUserId }: { otherUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function openDm() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_or_create_dm", {
      other_user: otherUserId,
    });
    if (!error && data) {
      router.push(`/chat/${data}`);
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={openDm}
      disabled={loading}
      className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold"
    >
      {loading ? "Abriendo…" : "Enviar mensaje"}
    </button>
  );
}
