"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images";
import { uploadToBucket } from "@/lib/storage";

export default function NewPostPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function publish() {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión");

      const blob = await compressImage(file);
      const path = await uploadToBucket(supabase, "posts", user.id, blob);

      const { error: insertError } = await supabase.from("posts").insert({
        author_id: user.id,
        image_url: path,
        caption: caption.trim() || null,
      });
      if (insertError) throw insertError;

      router.push("/feed");
      router.refresh();
    } catch {
      setError("No se pudo publicar. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 p-4">
      <h1 className="text-xl font-bold mb-4">Nueva publicación</h1>

      {!preview ? (
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-neutral-700 rounded-2xl py-20 cursor-pointer hover:border-neutral-500 transition-colors">
          <svg viewBox="0 0 24 24" className="w-12 h-12 fill-none stroke-neutral-500" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <path strokeLinecap="round" d="M21 15l-5-5-8 8" />
          </svg>
          <span className="text-sm text-neutral-400">Toca para elegir una foto</span>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa"
            className="w-full rounded-2xl max-h-[28rem] object-cover"
          />
          <textarea
            placeholder="Escribe un pie de foto…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2200}
            rows={3}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm focus:outline-none focus:border-neutral-600 resize-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="flex-1 rounded-lg border border-neutral-700 px-4 py-3 text-sm font-semibold"
            >
              Cambiar foto
            </button>
            <button
              onClick={publish}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold"
            >
              {loading ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
