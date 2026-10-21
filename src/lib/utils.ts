export function slugify(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "serie";
}

const STATUS_LABELS: Record<string, string> = {
  ONGOING: "En cours",
  COMPLETED: "Terminé",
  HIATUS: "En pause",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function chapterLabel(number: number, title?: string | null): string {
  const n = Number.isInteger(number) ? number : number;
  return `Chapitre ${n}${title ? ` — ${title}` : ""}`;
}

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
