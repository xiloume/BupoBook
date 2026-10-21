import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import fsp from "node:fs/promises";
import { mediaStream, mimeFor, resolveMediaPath } from "@/lib/media";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const abs = resolveMediaPath(segments.join("/"));
  if (!abs) return new NextResponse("Chemin invalide", { status: 400 });

  const stat = await fsp.stat(abs).catch(() => null);
  if (!stat?.isFile()) return new NextResponse("Introuvable", { status: 404 });

  const stream = Readable.toWeb(mediaStream(abs)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": mimeFor(abs),
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
