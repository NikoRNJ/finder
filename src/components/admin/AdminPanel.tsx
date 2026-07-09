"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  username: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
};

export default function AdminPanel({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMsg({ ok: false, text: data.error });
    } else {
      setMsg({ ok: true, text: `Usuario @${username} creado` });
      setUsername("");
      setPassword("");
      setDisplayName("");
      router.refresh();
    }
    setLoading(false);
  }

  async function resetPassword(id: string, uname: string) {
    const newPass = prompt(`Nueva contraseña para @${uname} (mín. 8 caracteres):`);
    if (!newPass) return;

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPass }),
    });
    const data = await res.json();
    setMsg(
      res.ok
        ? { ok: true, text: `Contraseña de @${uname} actualizada` }
        : { ok: false, text: data.error }
    );
  }

  async function deleteUser(id: string, uname: string) {
    if (!confirm(`¿Eliminar a @${uname}? Se borrarán todos sus datos.`)) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok) {
      setMsg({ ok: true, text: `@${uname} eliminado` });
      router.refresh();
    } else {
      setMsg({ ok: false, text: data.error });
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createUser}
        className="space-y-3 bg-neutral-900 rounded-xl p-4 border border-neutral-800"
      >
        <h2 className="font-semibold text-sm text-neutral-300">
          Crear nuevo usuario
        </h2>
        <input
          type="text"
          placeholder="Nombre de usuario (minúsculas)"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          autoCapitalize="none"
          required
          className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
        />
        <input
          type="text"
          placeholder="Nombre visible (opcional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
        />
        <input
          type="text"
          placeholder="Contraseña (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          {loading ? "Creando…" : "Crear usuario"}
        </button>
      </form>

      {msg && (
        <p
          className={`text-sm text-center ${
            msg.ok ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div>
        <h2 className="font-semibold text-sm text-neutral-300 mb-2">
          Usuarios ({users.length})
        </h2>
        <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 overflow-hidden">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between px-4 py-3 bg-neutral-900"
            >
              <div>
                <p className="text-sm font-medium">
                  @{u.username}
                  {u.is_admin && (
                    <span className="ml-2 text-xs text-amber-400">admin</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500">{u.display_name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => resetPassword(u.id, u.username)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Contraseña
                </button>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => deleteUser(u.id, u.username)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
