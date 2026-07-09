"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images";
import { uploadToBucket } from "@/lib/storage";

type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

export default function ChatThread({
  conversationId,
  userId,
  title,
  isGroup,
  memberCount,
  senderNames,
  initialMessages,
}: {
  conversationId: string;
  userId: string;
  title: string;
  isGroup: boolean;
  memberCount: number;
  senderNames: Record<string, string>;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // suscripción realtime a mensajes nuevos
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // firmar imágenes de mensajes
  useEffect(() => {
    const paths = messages
      .map((m) => m.image_url)
      .filter((p): p is string => !!p && !imageUrls[p]);
    if (paths.length === 0) return;

    const supabase = createClient();
    supabase.storage
      .from("chat-media")
      .createSignedUrls([...new Set(paths)], 3600)
      .then(({ data }) => {
        if (!data) return;
        setImageUrls((prev) => {
          const next = { ...prev };
          data.forEach((d) => {
            if (d.path && d.signedUrl) next[d.path] = d.signedUrl;
          });
          return next;
        });
      });
  }, [messages, imageUrls]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, content })
      .select()
      .single();

    if (error) {
      setText(content);
    } else if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data]
      );
    }
    setSending(false);
  }

  async function sendImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || sending) return;
    setSending(true);

    try {
      const supabase = createClient();
      const blob = await compressImage(file);
      const path = await uploadToBucket(supabase, "chat-media", userId, blob);
      const { data } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: userId, image_url: path })
        .select()
        .single();
      if (data) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.id) ? prev : [...prev, data]
        );
      }
    } finally {
      setSending(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center gap-3">
        <Link href="/chat" aria-label="Volver" className="text-neutral-400">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-bold leading-tight">{title}</h1>
          {isGroup && (
            <p className="text-xs text-neutral-500">{memberCount} miembros</p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                  mine
                    ? "bg-blue-600 rounded-br-md"
                    : "bg-neutral-800 rounded-bl-md"
                }`}
              >
                {isGroup && !mine && (
                  <p className="text-xs font-semibold text-blue-300 mb-0.5">
                    {senderNames[m.sender_id] ?? "•"}
                  </p>
                )}
                {m.image_url &&
                  (imageUrls[m.image_url] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrls[m.image_url]}
                      alt="Imagen"
                      className="rounded-lg max-h-64 mb-1"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-lg bg-neutral-700 animate-pulse mb-1" />
                  ))}
                {m.content && <p className="text-sm break-words">{m.content}</p>}
                <p className={`text-[10px] mt-0.5 ${mine ? "text-blue-200" : "text-neutral-500"}`}>
                  {new Date(m.created_at).toLocaleTimeString("es", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 px-3 py-2 border-t border-neutral-800 bg-neutral-950"
      >
        <label className="text-neutral-400 cursor-pointer p-1.5" aria-label="Enviar imagen">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <path strokeLinecap="round" d="M21 15l-5-5-8 8" />
          </svg>
          <input type="file" accept="image/*" onChange={sendImage} className="hidden" />
        </label>
        <input
          type="text"
          placeholder="Mensaje…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={4000}
          className="flex-1 rounded-full bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Enviar"
          className="rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 p-2.5"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
