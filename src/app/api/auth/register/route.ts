import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();

    if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (username.trim().length < 3) {
      return NextResponse.json({ error: "Pseudo trop court (min. 3 caractères)" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mot de passe trop court (min. 6 caractères)" }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: username.trim() }] },
    });
    if (exists) {
      return NextResponse.json({ error: "Email ou pseudo déjà utilisé" }, { status: 409 });
    }

    // Le tout premier compte créé devient administrateur
    const isFirst = (await prisma.user.count()) === 0;

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        username: username.trim(),
        passwordHash: await bcrypt.hash(password, 10),
        role: isFirst ? "ADMIN" : "USER",
      },
    });

    await createSession({ sub: user.id, role: user.role, username: user.username });
    return NextResponse.json({ ok: true, role: user.role });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
