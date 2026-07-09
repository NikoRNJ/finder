"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserOpt = { id: string; username: string };

export default function NewGroupButton({ users }: { users: UserOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createGroup() {
    if (!name.trim() || selected.size === 0) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({ is_group: true, name: name.trim(), created_by: user.id })
      .select()
      .single();

    if (convError || !conv) {
      setError("No se pudo crear el grupo");
      setLoading(false);
      return;
    }

    const members = [user.id, ...selected].map((uid) => ({
      conversation_id: conv.id,
      user_id: uid,
    }));
    const { error: memberError } = await supabase
      .from("conversation_members")
      .insert(members);

    if (memberError) {
      setError("Error al añadir miembros");
      setLoading(false);
      return;
    }

    setOpen(false);
    router.push(`/chat/${conv.id}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Nuevo grupo"
        className="text-neutral-300"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
          <circle cx="9" cy="8" r="3" />
          <path strokeLinecap="round" d="M3 19c0-3 2.7-4.5 6-4.5s6 1.5 6 4.5M18 8v6M21 11h-6" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
          <div className="bg-neutral-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85dvh] flex flex-col">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="font-bold">Nuevo grupo</h2>
              <button onClick={() => setOpen(false)} className="text-neutral-400 text-sm">
                Cancelar
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <input
                type="text"
                placeholder="Nombre del grupo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
              />

              <p className="text-xs text-neutral-500">
                Miembros ({selected.size} seleccionados)
              </p>
              <ul className="space-y-1">
                {users.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => toggle(u.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${
                        selected.has(u.id)
                          ? "bg-blue-600/20 border border-blue-600"
                          : "bg-neutral-950 border border-neutral-800"
                      }`}
                    >
                      <span>@{u.username}</span>
                      {selected.has(u.id) && <span className="text-blue-400">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <div className="p-4 border-t border-neutral-800">
              <button
                onClick={createGroup}
                disabled={loading || !name.trim() || selected.size === 0}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold"
              >
                {loading ? "Creando…" : "Crear grupo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
