import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json();

    if (typeof login !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: login.trim().toLowerCase() }, { username: login.trim() }] },
    });

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    await createSession({ sub: user.id, role: user.role, username: user.username });
    return NextResponse.json({ ok: true, role: user.role });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
