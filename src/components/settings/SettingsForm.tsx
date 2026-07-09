"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images";
import { uploadToBucket } from "@/lib/storage";
import Avatar from "@/components/ui/Avatar";

export default function SettingsForm({
  userId,
  username,
  displayName: initialDisplayName,
  bio: initialBio,
  avatarUrl,
}: {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function save() {
    setLoading(true);
    setMsg(null);

    try {
      const supabase = createClient();
      let avatarPath: string | undefined;

      if (avatarFile) {
        const blob = await compressImage(avatarFile, 512, 0.85);
        avatarPath = await uploadToBucket(supabase, "avatars", userId, blob);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          ...(avatarPath ? { avatar_url: avatarPath } : {}),
        })
        .eq("id", userId);
      if (error) throw error;

      if (newPassword) {
        if (newPassword.length < 8) throw new Error("Contraseña muy corta");
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passError) throw passError;
        setNewPassword("");
      }

      setMsg({ ok: true, text: "Cambios guardados" });
      router.refresh();
    } catch (e) {
      setMsg({
        ok: false,
        text: e instanceof Error ? e.message : "Error al guardar",
      });
    }
    setLoading(false);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar url={avatarPreview} name={username} size={72} />
        <label className="text-sm text-blue-400 cursor-pointer">
          Cambiar foto
          <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-neutral-400 block mb-1">Usuario</label>
          <input
            type="text"
            value={`@${username}`}
            disabled
            className="w-full rounded-lg bg-neutral-900/50 border border-neutral-800 px-4 py-2.5 text-sm text-neutral-500"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400 block mb-1">Nombre visible</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400 block mb-1">Biografía</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={3}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600 resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400 block mb-1">
            Nueva contraseña (dejar vacío para no cambiar)
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
          />
        </div>
      </div>

      {msg && (
        <p className={`text-sm text-center ${msg.ok ? "text-green-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}

      <button
        onClick={save}
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold"
      >
        {loading ? "Guardando…" : "Guardar cambios"}
      </button>

      <button
        onClick={logout}
        className="w-full rounded-lg border border-red-900 text-red-400 px-4 py-3 text-sm font-semibold"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
