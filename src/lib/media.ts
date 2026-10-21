import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? "./data");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export const ALLOWED_EXT = Object.keys(MIME);
export const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 Mo

export function mimeFor(filePath: string): string {
  return MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/** Sauvegarde un fichier uploadé dans DATA_DIR/subdir/name<ext>. Retourne le chemin relatif (style posix). */
export async function saveUpload(
  file: File,
  subdir: string,
  baseName: string
): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error(`Type de fichier non supporté : ${ext || file.name}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux (max 30 Mo) : ${file.name}`);
  }
  const dir = path.join(DATA_DIR, ...subdir.split("/"));
  await fsp.mkdir(dir, { recursive: true });
  const rel = `${subdir}/${baseName}${ext}`;
  const abs = path.join(DATA_DIR, ...rel.split("/"));
  await fsp.writeFile(abs, Buffer.from(await file.arrayBuffer()));
  return rel;
}

/** Résout un chemin relatif en chemin absolu, en bloquant toute sortie de DATA_DIR. */
export function resolveMediaPath(relPath: string): string | null {
  const abs = path.resolve(DATA_DIR, ...relPath.split("/"));
  if (abs !== DATA_DIR && !abs.startsWith(DATA_DIR + path.sep)) return null;
  return abs;
}

export function mediaStream(absPath: string) {
  return fs.createReadStream(absPath);
}

export async function deleteMedia(relPath: string | null | undefined) {
  if (!relPath) return;
  const abs = resolveMediaPath(relPath);
  if (abs) await fsp.rm(abs, { force: true });
}

export async function deleteMediaDir(subdir: string) {
  const abs = resolveMediaPath(subdir);
  if (abs) await fsp.rm(abs, { recursive: true, force: true });
}

/** URL publique d'un média stocké. */
export function mediaUrl(relPath: string | null | undefined): string | null {
  if (!relPath) return null;
  return "/api/media/" + relPath.split("/").map(encodeURIComponent).join("/");
}
