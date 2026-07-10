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
}

interface Props {
  order: OrderView;
  role: "buyer" | "seller";
}

export default function OrderCard({ order, role }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action =
    role === "seller" && order.status === "kjopt"
      ? { status: "sendt", label: "Merk som sendt" }
      : role === "buyer" && order.status === "sendt"
        ? { status: "levert", label: "Bekreft mottatt" }
        : null;

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
        {error && (
          <p className="mt-1 text-xs font-medium text-accent">{error}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <p className="font-bold text-brand-dark">{order.totalPrice} kr</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            order.status === "levert"
              ? "bg-brand text-white"
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
      </div>
    </div>
  );
}
