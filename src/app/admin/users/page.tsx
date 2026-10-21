import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import UserRow from "@/components/admin/UserRow";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (!me || !canManageUsers(me.role)) redirect("/admin/series");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { favorites: true, progress: true } },
    },
  });

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Utilisateurs ({users.length})</h2>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3">Activité</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={{
                  id: u.id,
                  username: u.username,
                  email: u.email,
                  role: u.role,
                  createdAt: u.createdAt.toISOString(),
                  favorites: u._count.favorites,
                  progress: u._count.progress,
                }}
                isSelf={u.id === me.id}
                actorRole={me.role}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
