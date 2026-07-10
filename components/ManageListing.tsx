"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookCondition, CONDITION_LABELS } from "@/types/marketplace";

interface Props {
  listingId: string;
  price: number;
  condition: BookCondition;
  description: string;
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand";

/** Selgerens verktøy på egen annonse: rediger pris/tilstand/beskrivelse eller slett. */
export default function ManageListing({
  listingId,
  price,
  condition,
  description,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    price: String(price),
    condition,
    description,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const newPrice = Number(form.price);
    if (!Number.isInteger(newPrice) || newPrice <= 0) {
      setError("Prisen må være et positivt heltall i kroner.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: newPrice,
          condition: form.condition,
          description: form.description,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "Vil du slette annonsen? Samtaler om annonsen slettes også."
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      router.push("/profil");
      router.refresh();
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-4 space-y-2">
        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-full bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark"
        >
          ✏️ Rediger annonsen
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="w-full rounded-full border border-border py-2.5 font-semibold text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
        >
          Slett annonsen
        </button>
        {error && (
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-3">
      <label className="text-sm font-medium" htmlFor="edit-price">
        Pris (kr)
      </label>
      <input
        id="edit-price"
        className={`${inputCls} mt-1`}
        inputMode="numeric"
        value={form.price}
        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
      />

      <label className="mt-3 block text-sm font-medium" htmlFor="edit-condition">
        Tilstand
      </label>
      <select
        id="edit-condition"
        className={`${inputCls} mt-1`}
        value={form.condition}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            condition: e.target.value as BookCondition,
          }))
        }
      >
        {(Object.keys(CONDITION_LABELS) as BookCondition[]).map((c) => (
          <option key={c} value={c}>
            {CONDITION_LABELS[c]}
          </option>
        ))}
      </select>

      <label
        className="mt-3 block text-sm font-medium"
        htmlFor="edit-description"
      >
        Beskrivelse
      </label>
      <textarea
        id="edit-description"
        rows={4}
        className={`${inputCls} mt-1`}
        value={form.description}
        onChange={(e) =>
          setForm((f) => ({ ...f, description: e.target.value }))
        }
      />

      {error && (
        <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="w-full rounded-full bg-brand py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Lagrer …" : "Lagre endringer"}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={busy}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
