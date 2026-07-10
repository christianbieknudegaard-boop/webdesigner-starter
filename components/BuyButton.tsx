"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  listingId: string;
  price: number;
  shippingPrice: number;
  loggedIn: boolean;
}

export default function BuyButton({
  listingId,
  price,
  shippingPrice,
  loggedIn,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [address, setAddress] = useState({
    name: "",
    street: "",
    postalCode: "",
    city: "",
  });

  function setField(key: keyof typeof address, value: string) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  if (!loggedIn) {
    return (
      <Link
        href="/logg-inn"
        className="mt-4 block w-full rounded-full bg-accent py-3 text-center font-semibold text-white transition hover:opacity-90"
      >
        Logg inn for å kjøpe
      </Link>
    );
  }

  if (done) {
    return (
      <div className="mt-4 rounded-xl bg-brand-light p-4 text-center">
        <p className="font-semibold text-brand-dark">🎉 Boken er din!</p>
        <p className="mt-1 text-sm text-brand-dark/80">
          Selgeren får beskjed og sender boken. Følg ordren på Min side.
        </p>
        <Link
          href="/profil"
          className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Gå til Min side
        </Link>
      </div>
    );
  }

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, address }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      // Ingen router.refresh() her: siden ville byttet til "solgt"-visning
      // og fjernet suksessmeldingen. Solgt-status vises ved neste besøk.
      setDone(true);
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-background p-4">
        <div className="space-y-1 text-sm">
          <p className="flex justify-between">
            <span className="text-muted">Boken</span>
            <span>{price} kr</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted">Frakt med sporing</span>
            <span>{shippingPrice} kr</span>
          </p>
          <p className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>Totalt</span>
            <span>{price + shippingPrice} kr</span>
          </p>
        </div>
        <p className="mt-3 text-sm font-medium">Leveringsadresse</p>
        <div className="mt-1 space-y-2">
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
            placeholder="Fullt navn"
            autoComplete="name"
            value={address.name}
            onChange={(e) => setField("name", e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
            placeholder="Gateadresse"
            autoComplete="street-address"
            value={address.street}
            onChange={(e) => setField("street", e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
              placeholder="Postnr."
              inputMode="numeric"
              maxLength={4}
              autoComplete="postal-code"
              value={address.postalCode}
              onChange={(e) => setField("postalCode", e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
              placeholder="Sted"
              autoComplete="address-level2"
              value={address.city}
              onChange={(e) => setField("city", e.target.value)}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          Betaling kommer i neste versjon – kjøpet reserverer boken for deg.
        </p>
        {error && (
          <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
            {error}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={buy}
            disabled={busy || Object.values(address).some((v) => !v.trim())}
            className="w-full rounded-full bg-accent py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Kjøper …" : "Bekreft kjøp"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted transition hover:border-brand"
          >
            Avbryt
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="mt-4 w-full rounded-full bg-accent py-3 font-semibold text-white transition hover:opacity-90"
    >
      Kjøp nå
    </button>
  );
}
