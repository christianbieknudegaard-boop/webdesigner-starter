"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface OrderView {
  id: string;
  listingId: string;
  title: string;
  author: string;
  counterpartLabel: string; // "Selger: Ingrid H." / "Kjøper: Magnus L."
  status: string;
  statusLabel: string;
  totalPrice: number;
  createdAt: string;
  /** Leveringsadresse – vises kun for selgeren. */
  shippingAddress?: string;
  /** Kjøperens vurdering (1–5), null hvis ikke gitt ennå. */
  rating?: number | null;
  /** Selgers sendefrist (ISO), null for gamle/fullførte ordrer. */
  shipDeadline?: string | null;
  deadlineExtended?: boolean;
  /** Når kjøperen ba om kansellering (ISO), null ellers. */
  cancelRequestedAt?: string | null;
}

interface Props {
  order: OrderView;
  role: "buyer" | "seller";
}

export default function OrderCard({ order, role }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState(0);

  const shouldRate =
    role === "buyer" && order.status === "levert" && order.rating == null;

  async function rate(stars: number) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/vurdering`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: stars }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      router.refresh();
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  const action =
    role === "seller" && order.status === "kjopt"
      ? { status: "sendt", label: "Merk som sendt" }
      : role === "buyer" && order.status === "sendt"
        ? { status: "levert", label: "Bekreft mottatt" }
        : null;

  async function post(path: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      router.refresh();
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(status: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      router.refresh();
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
      <div>
        <Link
          href={`/bok/${order.listingId}`}
          className="font-semibold text-foreground hover:text-brand-dark"
        >
          {order.title}
        </Link>
        <p className="text-sm text-muted">
          {order.author} · {order.counterpartLabel} ·{" "}
          {new Date(order.createdAt).toLocaleDateString("nb-NO")}
        </p>
        {role === "seller" && order.status !== "kansellert" && order.shippingAddress && (
          <p className="mt-1 text-sm text-foreground/80">
            📦 Sendes til: {order.shippingAddress}
          </p>
        )}
        {order.status === "kjopt" && order.shipDeadline && (
          <p className="mt-1 text-sm text-muted">
            ⏱️ Sendes innen{" "}
            {new Date(order.shipDeadline).toLocaleDateString("nb-NO", {
              day: "numeric",
              month: "long",
            })}
            {order.deadlineExtended ? " (utsatt)" : ""}
            {" – ellers kanselleres kjøpet automatisk"}
          </p>
        )}
        {order.status === "kjopt" && order.cancelRequestedAt && (
          <p className="mt-1 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
            {role === "buyer"
              ? "Kanselleringsforespørsel sendt – kanselleres automatisk hvis selgeren ikke svarer innen 48 timer."
              : "Kjøperen ønsker å kansellere. Send varen eller godta kanselleringen – uten svar innen 48 timer kanselleres ordren."}
          </p>
        )}
        {role === "buyer" && order.rating != null && (
          <p className="mt-1 text-sm text-muted">
            Din vurdering: {"★".repeat(order.rating)}
            {"☆".repeat(5 - order.rating)}
          </p>
        )}
        {shouldRate && (
          <div className="mt-1 flex items-center gap-1 text-sm">
            <span className="text-muted">Vurder selgeren:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                disabled={busy}
                onClick={() => rate(star)}
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(0)}
                aria-label={`${star} av 5 stjerner`}
                className="text-lg transition disabled:opacity-50"
              >
                {star <= hoverStar ? "★" : "☆"}
              </button>
            ))}
          </div>
        )}
        {error && (
          <p className="mt-1 text-xs font-medium text-accent">{error}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-brand-dark">{order.totalPrice} kr</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            order.status === "levert"
              ? "bg-brand text-white"
              : order.status === "kansellert"
                ? "bg-border text-muted"
                : "bg-brand-light text-brand-dark"
          }`}
        >
          {order.statusLabel}
        </span>
        {action && (
          <button
            onClick={() => runAction(action.status)}
            disabled={busy}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Lagrer …" : action.label}
          </button>
        )}
        {role === "seller" &&
          order.status === "kjopt" &&
          !order.deadlineExtended && (
            <button
              onClick={() => post(`/api/orders/${order.id}/utsett`)}
              disabled={busy}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-brand hover:text-brand-dark disabled:opacity-60"
            >
              Utsett frist +2 dager
            </button>
          )}
        {role === "seller" &&
          order.status === "kjopt" &&
          order.cancelRequestedAt && (
            <button
              onClick={() => post(`/api/orders/${order.id}/kansellering`)}
              disabled={busy}
              className="rounded-full border border-accent px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/10 disabled:opacity-60"
            >
              Godta kansellering
            </button>
          )}
        {role === "buyer" &&
          order.status === "kjopt" &&
          !order.cancelRequestedAt && (
            <button
              onClick={() => post(`/api/orders/${order.id}/kansellering`)}
              disabled={busy}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
            >
              Be om kansellering
            </button>
          )}
      </div>
    </div>
  );
}
