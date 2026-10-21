import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireContentManager } from "@/lib/auth";
import { deleteMedia, deleteMediaDir, saveUpload } from "@/lib/media";
import { slugify } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const series = await prisma.series.findUnique({ where: { id } });
  if (!series) return NextResponse.json({ error: "Série introuvable" }, { status: 404 });

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  let slug = String(form.get("slug") ?? "").trim() || slugify(title);
  const conflict = await prisma.series.findFirst({ where: { slug, NOT: { id } } });
  if (conflict) slug = `${slug}-${id.slice(-4)}`;

  await prisma.series.update({
    where: { id },
    data: {
      title,
      slug,
      author: String(form.get("author") ?? "").trim() || null,
      artist: String(form.get("artist") ?? "").trim() || null,
      description: String(form.get("description") ?? "").trim() || null,
      status: String(form.get("status") ?? series.status),
      genres: String(form.get("genres") ?? "").trim(),
    },
  });

  const cover = form.get("cover");
  if (cover instanceof File && cover.size > 0) {
    try {
      const rel = await saveUpload(cover, "covers", id);
      await deleteMedia(series.coverPath);
      await prisma.series.update({ where: { id }, data: { coverPath: rel } });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const series = await prisma.series.findUnique({
    where: { id },
    include: { chapters: { select: { id: true } } },
  });
  if (!series) return NextResponse.json({ error: "Série introuvable" }, { status: 404 });

  await deleteMedia(series.coverPath);
  for (const ch of series.chapters) {
    await deleteMediaDir(`pages/${ch.id}`);
  }
  await prisma.series.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
