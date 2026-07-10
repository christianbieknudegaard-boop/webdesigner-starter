"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  listingId: string;
  sellerName: string;
  loggedIn: boolean;
}

export default function MessageSellerButton({
  listingId,
  sellerName,
  loggedIn,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loggedIn) {
    return (
      <Link
        href="/logg-inn"
        className="mt-2 block w-full rounded-full border border-brand py-3 text-center font-semibold text-brand transition hover:bg-brand-light"
      >
        Logg inn for å kontakte selger
      </Link>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full rounded-full border border-brand py-3 font-semibold text-brand transition hover:bg-brand-light"
      >
        💬 Send melding til selger
      </button>
    );
  }

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/meldinger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, body }),
      });
      const data = (await res.json()) as {
        conversationId?: string;
        error?: string;
      };
      if (!res.ok || !data.conversationId) {
        setError(data.error ?? "Meldingen ble ikke sendt. Prøv igjen.");
        return;
      }
      router.push(`/meldinger/${data.conversationId}`);
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-border bg-background p-3">
      <label className="text-sm font-medium" htmlFor="message-seller">
        Melding til {sellerName}
      </label>
      <textarea
        id="message-seller"
        rows={3}
        autoFocus
        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
        placeholder="Hei! Er boken fortsatt tilgjengelig?"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={2000}
      />
      {error && (
        <p className="mt-1 text-xs font-medium text-accent">{error}</p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          onClick={send}
          disabled={busy || !draft.trim()}
          className="w-full rounded-full bg-brand py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Sender …" : "Send"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
