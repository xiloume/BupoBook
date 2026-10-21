import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUserManager } from "@/lib/auth";
import { isRole } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

/** Un modo ne peut pas toucher un compte admin ni promouvoir au rôle admin. */
function canActOn(actorRole: string, targetRole: string, newRole?: string) {
  if (actorRole === "ADMIN") return true;
  if (targetRole === "ADMIN") return false;
  if (newRole === "ADMIN") return false;
  return true;
}

// PATCH : { role?: "USER" | "EDITEUR" | "MODO" | "ADMIN", password?: string }
export async function PATCH(req: Request, ctx: Ctx) {
  const actor = await requireUserManager();
  if (!actor) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const { role, password } = await req.json();
  const data: { role?: string; passwordHash?: string } = {};

  if (role !== undefined) {
    if (typeof role !== "string" || !isRole(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    if (id === actor.id && role !== actor.role) {
      return NextResponse.json(
        { error: "Tu ne peux pas changer ton propre rôle" },
        { status: 400 }
      );
    }
    if (!canActOn(actor.role, target.role, role)) {
      return NextResponse.json(
        { error: "Seul un admin peut gérer un compte admin ou promouvoir admin" },
        { status: 403 }
      );
    }
    data.role = role;
  }

  if (password !== undefined) {
    if (!canActOn(actor.role, target.role)) {
      return NextResponse.json(
        { error: "Seul un admin peut modifier un compte admin" },
        { status: 403 }
      );
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Mot de passe trop court (min. 6 caractères)" },
        { status: 400 }
      );
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const actor = await requireUserManager();
  if (!actor) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;
  if (id === actor.id) {
    return NextResponse.json(
      { error: "Tu ne peux pas supprimer ton propre compte" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  if (!canActOn(actor.role, target.role)) {
    return NextResponse.json(
      { error: "Seul un admin peut supprimer un compte admin" },
      { status: 403 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
