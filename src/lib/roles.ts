export const ROLES = ["USER", "EDITEUR", "MODO", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Lecteur",
  EDITEUR: "Éditeur",
  MODO: "Modérateur",
  ADMIN: "Admin",
};

export function isRole(r: string): r is Role {
  return (ROLES as readonly string[]).includes(r);
}

/** Accès au panneau d'admin (contenu : séries/chapitres/pages). */
export function canAccessAdmin(role: string): boolean {
  return role === "EDITEUR" || role === "MODO" || role === "ADMIN";
}

/** Gestion des utilisateurs. */
export function canManageUsers(role: string): boolean {
  return role === "MODO" || role === "ADMIN";
}

/** Tableau de bord avec les stats. */
export function canSeeDashboard(role: string): boolean {
  return role === "ADMIN";
}
