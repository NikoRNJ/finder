"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/time";

type Story = {
  id: string;
  url: string;
  created_at: string;
  viewers: string[];
};

const DURATION = 5000;

export default function StoryViewer({
  stories,
  authorUsername,
  isOwner,
  viewerId,
}: {
  stories: Story[];
  authorUsername: string;
  isOwner: boolean;
  viewerId: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = stories[index];

  const close = useCallback(() => router.push("/feed"), [router]);

  const next = useCallback(() => {
    setShowViewers(false);
    setIndex((i) => {
      if (i + 1 >= stories.length) {
        close();
        return i;
      }
      return i + 1;
    });
  }, [stories.length, close]);

  const prev = useCallback(() => {
    setShowViewers(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // registrar vista
  useEffect(() => {
    if (isOwner || !current) return;
    const supabase = createClient();
    supabase
      .from("story_views")
      .upsert(
        { story_id: current.id, viewer_id: viewerId },
        { onConflict: "story_id,viewer_id", ignoreDuplicates: true }
      )
      .then(() => {});
  }, [current, isOwner, viewerId]);

  // auto-avance
  useEffect(() => {
    if (showViewers) return;
    timerRef.current = setTimeout(next, DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, next, showViewers]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* barras de progreso */}
      <div className="flex gap-1 p-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        {stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-0.5 rounded bg-white/30 overflow-hidden">
            <div
              className={`h-full bg-white ${
                i < index ? "w-full" : i === index && !showViewers ? "animate-story-progress" : "w-0"
              }`}
              style={
                i === index && !showViewers
                  ? { animationDuration: `${DURATION}ms` }
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-sm font-semibold text-white">
          {authorUsername}
          <span className="text-white/50 font-normal ml-2">
            {timeAgo(current.created_at)}
          </span>
        </p>
        <button onClick={close} aria-label="Cerrar" className="text-white text-2xl leading-none">
          ×
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt="Historia" className="max-h-full max-w-full object-contain" />
        {/* zonas táctiles */}
        <button className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-label="Anterior" />
        <button className="absolute inset-y-0 right-0 w-2/3" onClick={next} aria-label="Siguiente" />
      </div>

      {isOwner && (
        <div className="pb-[max(1rem,env(safe-area-inset-bottom))] px-4">
          <button
            onClick={() => setShowViewers((v) => !v)}
            className="text-sm text-white/80"
          >
            👁 Visto por {current.viewers.length}
          </button>
          {showViewers && (
            <ul className="mt-2 max-h-40 overflow-y-auto text-sm text-white/90 space-y-1">
              {current.viewers.length === 0 ? (
                <li className="text-white/50">Nadie todavía</li>
              ) : (
                current.viewers.map((u) => <li key={u}>@{u}</li>)
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
