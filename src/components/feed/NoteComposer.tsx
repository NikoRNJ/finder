"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NoteComposer({
  existingNote,
}: {
  existingNote: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(existingNote ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    const text = content.trim();
    if (!text) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // trigger en DB elimina la nota anterior
    const { error } = await supabase
      .from("notes")
      .insert({ author_id: user.id, content: text });

    if (!error) {
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="shrink-0 max-w-36 text-left">
        <div
          className={`rounded-2xl rounded-bl-sm px-3 py-2 border ${
            existingNote
              ? "bg-neutral-800 border-transparent"
              : "border-dashed border-neutral-600"
          }`}
        >
          <p className={`text-xs ${existingNote ? "" : "text-neutral-500"}`}>
            {existingNote ?? "Escribe una nota…"}
          </p>
        </div>
        <p className="text-[10px] text-neutral-500 mt-1 px-1">Tu nota</p>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-neutral-900 rounded-2xl w-full max-w-sm p-4 space-y-3">
            <h2 className="font-bold text-sm">Tu nota (24 h)</h2>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={60}
              placeholder="¿Qué estás pensando?"
              autoFocus
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
            />
            <p className="text-xs text-neutral-500 text-right">{content.length}/60</p>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={loading || !content.trim()}
                className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold"
              >
                {loading ? "Guardando…" : "Compartir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
