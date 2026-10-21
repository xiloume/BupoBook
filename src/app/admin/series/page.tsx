import Link from "next/link";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { statusLabel } from "@/lib/utils";
import DeleteSeriesButton from "@/components/admin/DeleteSeriesButton";

export const dynamic = "force-dynamic";

export default async function AdminSeriesPage() {
  const series = await prisma.series.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Séries ({series.length})</h2>
        <Link
          href="/admin/series/new"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          + Nouvelle série
        </Link>
      </div>

      {series.length === 0 ? (
        <p className="text-zinc-500">Aucune série. Crée-en une pour commencer.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-4 px-4 py-3">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-zinc-800">
                {s.coverPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(s.coverPath)!}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-zinc-500">
                  /{s.slug} · {statusLabel(s.status)} · {s._count.chapters} chapitre
                  {s._count.chapters > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href={`/series/${s.slug}`}
                  className="text-zinc-400 hover:text-white"
                  target="_blank"
                >
                  Voir
                </Link>
                <Link
                  href={`/admin/series/${s.id}`}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Éditer
                </Link>
                <DeleteSeriesButton id={s.id} title={s.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
