import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireContentManager } from "@/lib/auth";
import { saveUpload } from "@/lib/media";
import { slugify } from "@/lib/utils";

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let i = 2;
  while (
    await prisma.series.findFirst({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    })
  ) {
    slug = `${slugify(base)}-${i++}`;
  }
  return slug;
}

export async function POST(req: Request) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const slug = await uniqueSlug(String(form.get("slug") ?? "") || title);

  const series = await prisma.series.create({
    data: {
      title,
      slug,
      author: String(form.get("author") ?? "").trim() || null,
      artist: String(form.get("artist") ?? "").trim() || null,
      description: String(form.get("description") ?? "").trim() || null,
      status: String(form.get("status") ?? "ONGOING"),
      genres: String(form.get("genres") ?? "").trim(),
    },
  });

  const cover = form.get("cover");
  if (cover instanceof File && cover.size > 0) {
    try {
      const rel = await saveUpload(cover, "covers", series.id);
      await prisma.series.update({ where: { id: series.id }, data: { coverPath: rel } });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, id: series.id });
}
