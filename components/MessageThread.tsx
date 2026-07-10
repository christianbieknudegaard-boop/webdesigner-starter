"use client";

import { useEffect, useRef, useState } from "react";

export interface ThreadMessage {
  id: string;
  body: string;
  mine: boolean;
  senderName: string;
  createdAt: string;
}

interface Props {
  conversationId: string;
  initialMessages: ThreadMessage[];
}

const POLL_INTERVAL_MS = 8000;

export default function MessageThread({
  conversationId,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(initialMessages.length);

  // Hent nye meldinger med jevne mellomrom
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/meldinger/${conversationId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          conversation: { messages: ThreadMessage[] };
        };
        setMessages(data.conversation.messages);
      } catch {
        // Nettverksglipp – prøver igjen på neste tick.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [conversationId]);

  // Rull til bunnen når det kommer nye meldinger
  useEffect(() => {
    if (messages.length > countRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    countRef.current = messages.length;
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/meldinger/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Meldingen ble ikke sendt. Prøv igjen.");
        return;
      }
      setDraft("");
      // Hent tråden på nytt så vår melding vises med riktig tidsstempel
      const refreshed = await fetch(`/api/meldinger/${conversationId}`);
      if (refreshed.ok) {
        const data2 = (await refreshed.json()) as {
          conversation: { messages: ThreadMessage[] };
        };
        setMessages(data2.conversation.messages);
      }
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                m.mine
                  ? "rounded-br-sm bg-brand text-white"
                  : "rounded-bl-sm bg-brand-light text-brand-dark"
              }`}
            >
              <p className="whitespace-pre-line break-words">{m.body}</p>
              <p
                className={`mt-1 text-xs ${m.mine ? "text-white/70" : "text-brand-dark/60"}`}
              >
                {new Date(m.createdAt).toLocaleString("nb-NO", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="w-full rounded-full border border-border bg-surface px-5 py-3 outline-none placeholder:text-muted focus:border-brand"
          placeholder="Skriv en melding …"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="shrink-0 rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
      {error && (
        <p className="mt-2 rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
