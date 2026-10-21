import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

if (process.env.NODE_ENV === "production" && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error("SESSION_SECRET manquant ou trop court (32 caractères min.) : refus de démarrer.");
}
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-me"
);

const PANEL_ROLES = ["EDITEUR", "MODO", "ADMIN"];
const USER_MGR_ROLES = ["MODO", "ADMIN"];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("bupobook_session")?.value;
  let role: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      role = (payload.role as string) ?? null;
    } catch {
      role = null;
    }
  }

  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");

  function deny() {
    if (isApi) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    if (!role) {
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
    } else {
      url.pathname = "/";
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  // Gestion des utilisateurs : modo + admin
  if (pathname.startsWith("/api/admin/users") || pathname.startsWith("/admin/users")) {
    if (!role || !USER_MGR_ROLES.includes(role)) return deny();
    return NextResponse.next();
  }

  // Tableau de bord : admin uniquement — les autres rôles du panneau
  // sont renvoyés vers la gestion des séries
  if (pathname === "/admin") {
    if (!role) return deny();
    if (role === "ADMIN") return NextResponse.next();
    if (PANEL_ROLES.includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/series";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return deny();
  }

  // Reste du panneau admin (séries, chapitres, pages) : éditeur + modo + admin
  if (!role || !PANEL_ROLES.includes(role)) return deny();
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/admin/:path*"],
};
