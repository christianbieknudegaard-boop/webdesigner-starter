"use client";

import { useState } from "react";

const REASONS: Record<string, string> = {
  svindel: "Mistanke om svindel",
  "feil-informasjon": "Feil informasjon om boken",
  upassende: "Upassende innhold",
  annet: "Annet",
};

export default function ReportListingButton({
  listingId,
  loggedIn,
}: {
  listingId: string;
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loggedIn) return null;

  if (done) {
    return (
      <p className="mt-3 text-center text-xs text-muted">
        ✓ Takk! Rapporten er mottatt og blir gjennomgått.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full text-center text-xs text-muted underline-offset-2 hover:underline"
      >
        🚩 Rapporter annonsen
      </button>
    );
  }

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rapporter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason, comment }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      setDone(true);
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-background p-3 text-sm">
      <p className="font-medium">Hva er galt med annonsen?</p>
      <select
        className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      >
        <option value="">Velg årsak</option>
        {Object.entries(REASONS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        rows={2}
        className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
        placeholder="Utdyp gjerne (valgfritt)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
      />
      {error && (
        <p className="mt-1 text-xs font-medium text-accent">{error}</p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          onClick={send}
          disabled={busy || !reason}
          className="w-full rounded-full bg-brand py-2 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Sender …" : "Send rapport"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-full border border-border px-3 py-2 text-xs font-medium text-muted"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
