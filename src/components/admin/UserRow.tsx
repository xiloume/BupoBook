"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  favorites: number;
  progress: number;
};

const ROLE_LABELS: Record<string, string> = {
  USER: "Lecteur",
  EDITEUR: "Éditeur",
  MODO: "Modérateur",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  USER: "bg-zinc-800 text-zinc-300",
  EDITEUR: "bg-emerald-500/15 text-emerald-400",
  MODO: "bg-violet-500/15 text-violet-400",
  ADMIN: "bg-amber-500/15 text-amber-400",
};

// Rôles qu'un acteur peut attribuer : un modo ne peut pas créer d'admin
function assignableRoles(actorRole: string): string[] {
  return actorRole === "ADMIN"
    ? ["USER", "EDITEUR", "MODO", "ADMIN"]
    : ["USER", "EDITEUR", "MODO"];
}

export default function UserRow({
  user,
  isSelf,
  actorRole,
}: {
  user: User;
  isSelf: boolean;
  actorRole: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Un modo ne peut rien faire sur un compte admin ; personne sur soi-même
  const canEdit =
    !isSelf && (actorRole === "ADMIN" || user.role !== "ADMIN");

  async function patch(body: object) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Erreur");
  }

  async function changeRole(role: string) {
    setBusy(true);
    setError(null);
    try {
      await patch({ role });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    const pwd = prompt(`Nouveau mot de passe pour « ${user.username} » (min. 6 caractères) :`);
    if (pwd === null) return;
    setBusy(true);
    setError(null);
    try {
      await patch({ password: pwd });
      alert("Mot de passe réinitialisé.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        `Supprimer définitivement « ${user.username} » ?\nSes favoris et sa progression seront effacés.`
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const action = "hover:underline disabled:opacity-40";

  return (
    <tr>
      <td className="px-4 py-3 font-medium">
        {user.username}
        {isSelf && <span className="ml-2 text-xs text-zinc-500">(toi)</span>}
      </td>
      <td className="px-4 py-3 text-zinc-400">{user.email}</td>
      <td className="px-4 py-3">
        {canEdit ? (
          <select
            value={user.role}
            disabled={busy}
            onChange={(e) => changeRole(e.target.value)}
            className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none ${ROLE_COLORS[user.role] ?? ROLE_COLORS.USER}`}
          >
            {assignableRoles(actorRole).map((r) => (
              <option key={r} value={r} className="bg-zinc-900 text-zinc-200">
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              ROLE_COLORS[user.role] ?? ROLE_COLORS.USER
            }`}
          >
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-zinc-400">
        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {user.favorites} favori{user.favorites > 1 ? "s" : ""} · {user.progress} lecture
        {user.progress > 1 ? "s" : ""}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex flex-col items-end gap-1">
          {canEdit && (
            <div className="flex gap-3 text-xs">
              <button onClick={resetPassword} disabled={busy} className={`${action} text-zinc-300`}>
                Reset MDP
              </button>
              <button onClick={remove} disabled={busy} className={`${action} text-red-400`}>
                Supprimer
              </button>
            </div>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </td>
    </tr>
  );
}
