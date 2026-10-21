import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireContentManager } from "@/lib/auth";
import { saveUpload } from "@/lib/media";

type Ctx = { params: Promise<{ id: string }> };

// Upload de plusieurs images : champ "pages" (multiple), dans l'ordre du sélecteur
export async function POST(req: Request, ctx: Ctx) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const chapter = await prisma.chapter.findUnique({ where: { id } });
  if (!chapter) return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });

  const form = await req.formData();
  const files = form
    .getAll("pages")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Aucune image envoyée" }, { status: 400 });
  }

  const max = await prisma.page.aggregate({
    where: { chapterId: id },
    _max: { index: true },
  });
  let index = (max._max.index ?? -1) + 1;

  const errors: string[] = [];
  let added = 0;
  for (const file of files) {
    try {
      const rel = await saveUpload(file, `pages/${id}`, String(index).padStart(4, "0"));
      await prisma.page.create({ data: { chapterId: id, index, path: rel } });
      index++;
      added++;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  return NextResponse.json({ ok: true, added, errors });
}
