import { prisma } from "./db";
import { getSession } from "./session";
import { canAccessAdmin, canManageUsers } from "./roles";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, username: true, role: true },
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** Éditeur, modérateur ou admin — gestion du contenu. */
export async function requireContentManager() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user.role)) return null;
  return user;
}

/** Modérateur ou admin — gestion des utilisateurs. */
export async function requireUserManager() {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user.role)) return null;
  return user;
}
