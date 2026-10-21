import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { chapterLabel, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/admin/series");

  const [users, series, chapters, pages, latestChapters] = await Promise.all([
    prisma.user.count(),
    prisma.series.count(),
    prisma.chapter.count(),
    prisma.page.count(),
    prisma.chapter.findMany({
      orderBy: { publishedAt: "desc" },
      take: 8,
      include: { series: true, _count: { select: { pages: true } } },
    }),
  ]);

  const stats = [
    { label: "Séries", value: series },
    { label: "Chapitres", value: chapters },
    { label: "Pages", value: pages },
    { label: "Utilisateurs", value: users },
  ];

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-3xl font-extrabold text-emerald-400">{s.value}</p>
            <p className="mt-1 text-sm text-zinc-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Derniers chapitres publiés</h2>
        <Link
          href="/admin/series/new"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          + Nouvelle série
        </Link>
      </div>

      {latestChapters.length === 0 ? (
        <p className="text-zinc-500">Aucun chapitre. Commence par créer une série.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {latestChapters.map((ch) => (
            <li key={ch.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {ch.series.title} — {chapterLabel(ch.number, ch.title)}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDate(ch.publishedAt)} · {ch._count.pages} page{ch._count.pages > 1 ? "s" : ""}
                </p>
              </div>
              <Link
                href={`/admin/chapters/${ch.id}`}
                className="text-sm text-emerald-400 hover:text-emerald-300"
              >
                Gérer les pages →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
