"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/ui/Avatar";

type Result = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  signedAvatar?: string | null;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(20);

      const rows = (data ?? []) as Result[];

      // firmar avatares
      const paths = rows.map((r) => r.avatar_url).filter((p): p is string => !!p);
      if (paths.length > 0) {
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrls(paths, 3600);
        const map = new Map(signed?.map((s) => [s.path ?? "", s.signedUrl]));
        rows.forEach((r) => {
          r.signedAvatar = r.avatar_url ? map.get(r.avatar_url) ?? null : null;
        });
      }

      setResults(rows);
      setSearched(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <main className="flex-1 p-4">
      <h1 className="text-xl font-bold mb-4">Buscar</h1>
      <input
        type="search"
        placeholder="Buscar usuarios…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoCapitalize="none"
        className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
      />

      <div className="mt-4 divide-y divide-neutral-800">
        {results.map((r) => (
          <Link
            key={r.id}
            href={`/profile/${r.username}`}
            className="flex items-center gap-3 py-3"
          >
            <Avatar url={r.signedAvatar} name={r.username} size={44} />
            <div>
              <p className="text-sm font-semibold">@{r.username}</p>
              {r.display_name && (
                <p className="text-xs text-neutral-500">{r.display_name}</p>
              )}
            </div>
          </Link>
        ))}
        {searched && results.length === 0 && (
          <p className="text-center text-neutral-500 text-sm py-10">
            Sin resultados para “{query}”
          </p>
        )}
      </div>
    </main>
  );
}
