import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { seriesId } = await req.json();
  if (typeof seriesId !== "string") {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const key = { userId_seriesId: { userId: session.sub, seriesId } };
  const existing = await prisma.favorite.findUnique({ where: key });

  if (existing) {
    await prisma.favorite.delete({ where: key });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { userId: session.sub, seriesId } });
  return NextResponse.json({ favorited: true });
}
