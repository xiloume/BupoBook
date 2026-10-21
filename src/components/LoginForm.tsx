"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/";
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : "/";
  const ssoErrors: Record<string, string> = {
    access_denied: "Votre compte BupoHub n'a pas accès à ce service.",
    sso_failed: "Échec de la connexion via BupoHub. Réessayez.",
    sso_state: "Session expirée pendant la connexion. Réessayez.",
    sso_unavailable: "La connexion via BupoHub n'est pas configurée.",
  };
  const ssoError = searchParams.get("error") ? ssoErrors[searchParams.get("error")!] ?? "Erreur de connexion" : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de connexion");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-emerald-500";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        className={input}
        placeholder="Email ou pseudo"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        autoComplete="username"
        required
      />
      <input
        className={input}
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {ssoError && <p className="text-sm text-red-400">{ssoError}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {busy ? "Connexion…" : "Se connecter"}
      </button>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-800" />
        ou
        <span className="h-px flex-1 bg-zinc-800" />
      </div>
      <a
        href={`/api/auth/hub?next=${encodeURIComponent(next)}`}
        className="block w-full rounded-md border border-amber-500/40 bg-amber-500/10 py-2.5 text-center text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
      >
        Se connecter avec BupoHub
      </a>
    </form>
  );
}
