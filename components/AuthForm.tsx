"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none placeholder:text-muted focus:border-brand";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/registrer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login"
              ? { email, password }
              : { name, city, email, password }
          ),
        }
      );
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

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6"
    >
      {mode === "register" && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="name">
              Navn
            </label>
            <input
              id="name"
              className={inputCls}
              placeholder="Fornavn og etternavn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="city">
              Sted
            </label>
            <input
              id="city"
              className={inputCls}
              placeholder="F.eks. Oslo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
            />
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          E-post
        </label>
        <input
          id="email"
          type="email"
          className={inputCls}
          placeholder="deg@eksempel.no"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Passord
        </label>
        <input
          id="password"
          type="password"
          className={inputCls}
          placeholder={mode === "register" ? "Minst 8 tegn" : "Ditt passord"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
        />
      </div>

      {error && (
        <p className="rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy
          ? "Vent litt …"
          : mode === "login"
            ? "Logg inn"
            : "Opprett konto"}
      </button>

      {mode === "register" && (
        <p className="text-center text-xs text-muted">
          Ved å opprette konto godtar du{" "}
          <Link href="/vilkar" className="underline hover:text-brand-dark">
            brukervilkårene
          </Link>{" "}
          og{" "}
          <Link href="/personvern" className="underline hover:text-brand-dark">
            personvernerklæringen
          </Link>
          .
        </p>
      )}

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Ny på Bokfink?{" "}
            <Link href="/registrer" className="font-medium text-brand hover:underline">
              Opprett konto
            </Link>
          </>
        ) : (
          <>
            Har du konto fra før?{" "}
            <Link href="/logg-inn" className="font-medium text-brand hover:underline">
              Logg inn
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
