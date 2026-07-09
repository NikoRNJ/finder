"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images";
import { uploadToBucket } from "@/lib/storage";

export default function NewStoryPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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

      const blob = await compressImage(file, 1080, 0.8);
      const path = await uploadToBucket(supabase, "stories", user.id, blob);

      const { error: insertError } = await supabase.from("stories").insert({
        author_id: user.id,
        image_url: path,
      });
      if (insertError) throw insertError;

      router.push("/feed");
      router.refresh();
    } catch {
      setError("No se pudo subir la historia");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 p-4">
      <h1 className="text-xl font-bold mb-4">Nueva historia</h1>

      {!preview ? (
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-neutral-700 rounded-2xl py-24 cursor-pointer hover:border-neutral-500 transition-colors">
          <svg viewBox="0 0 24 24" className="w-12 h-12 fill-none stroke-neutral-500" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-sm text-neutral-400">
            Elige una foto (desaparece en 24 h)
          </span>
          <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        </label>
      ) : (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa"
            className="w-full rounded-2xl max-h-[32rem] object-cover"
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
              Cambiar
            </button>
            <button
              onClick={publish}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold"
            >
              {loading ? "Subiendo…" : "Compartir historia"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
