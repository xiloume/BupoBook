import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import { statusLabel } from "@/lib/utils";

type Props = {
  slug: string;
  title: string;
  coverPath: string | null;
  status: string;
  chapterCount?: number;
};

export default function SeriesCard({ slug, title, coverPath, status, chapterCount }: Props) {
  const cover = mediaUrl(coverPath);

  return (
    <Link
      href={`/series/${slug}`}
      className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition hover:border-zinc-600"
    >
      <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-800">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900 to-zinc-900 p-4 text-center text-lg font-bold text-zinc-300">
            {title}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {statusLabel(status)}
          {chapterCount !== undefined && ` · ${chapterCount} chapitre${chapterCount > 1 ? "s" : ""}`}
        </p>
      </div>
    </Link>
  );
}
