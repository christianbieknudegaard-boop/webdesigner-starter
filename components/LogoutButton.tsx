"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
    >
      {busy ? "Logger ut …" : "Logg ut"}
    </button>
  );
}
