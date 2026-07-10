"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/konto", { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
      >
        Slett kontoen min
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
      <p className="font-semibold text-accent">Slette kontoen?</p>
      <p className="mt-1 text-muted">
        Usolgte annonser og samtalene dine slettes, og profilen anonymiseres.
        Fullførte kjøp og salg beholdes uten personopplysninger. Dette kan
        ikke angres.
      </p>
      {error && (
        <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={remove}
          disabled={busy}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Sletter …" : "Ja, slett kontoen permanent"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
