import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin, canManageUsers, canSeeDashboard, ROLE_LABELS, isRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user.role)) redirect("/login?next=/admin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center gap-6 border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-amber-400">Administration</h1>
        {isRole(user.role) && (
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
            {ROLE_LABELS[user.role]}
          </span>
        )}
        {canSeeDashboard(user.role) && (
          <Link href="/admin" className="text-sm text-zinc-300 hover:text-white">
            Tableau de bord
          </Link>
        )}
        <Link href="/admin/series" className="text-sm text-zinc-300 hover:text-white">
          Séries
        </Link>
        {canManageUsers(user.role) && (
          <Link href="/admin/users" className="text-sm text-zinc-300 hover:text-white">
            Utilisateurs
          </Link>
        )}
        <Link href="/" className="ml-auto text-sm text-zinc-500 hover:text-white">
          ← Retour au site
        </Link>
      </div>
      {children}
    </div>
  );
}
