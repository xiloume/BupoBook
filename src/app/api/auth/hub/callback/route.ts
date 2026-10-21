import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { exchangeHubCode, APP_URL } from "@/lib/hub";

const SSO_COOKIE = "bupobook_sso";

function fail(error: string) {
  const res = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, APP_URL));
  res.cookies.delete(SSO_COOKIE);
  return res;
}

/** Chemin interne uniquement (bloque //site.com et /\site.com). */
function safeNext(next: unknown) {
  return typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : "/";
}

/** GET /api/auth/hub/callback?code&state — retour de BupoHub, crée la session locale. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) return fail(sp.get("error")!);

  const code = sp.get("code") ?? "";
  const state = sp.get("state") ?? "";
  let next = "/";
  try {
    const stored = JSON.parse(req.cookies.get(SSO_COOKIE)?.value ?? "") as { state: string; next?: string };
    if (!state || stored.state !== state) throw new Error("state mismatch");
    next = safeNext(stored.next);
  } catch {
    return fail("sso_state");
  }

  const profile = await exchangeHubCode(code);
  if (!profile) return fail("sso_failed");
  if (!profile.hasServiceAccess) return fail("access_denied");

  const email = profile.email?.toLowerCase() ?? "";

  // 1. Compte déjà lié par hubId
  let user = await prisma.user.findUnique({ where: { hubId: profile.sub } });

  // 2. Sinon, lie un compte existant par email — uniquement si BupoHub garantit l'email
  //    (sinon n'importe qui pourrait mettre l'email d'un autre et prendre son compte).
  if (!user && email && profile.emailVerified === true) {
    const byEmail = await prisma.user.findFirst({ where: { email, hubId: null } });
    if (byEmail) user = await prisma.user.update({ where: { id: byEmail.id }, data: { hubId: profile.sub } });
  }

  // 3. Sinon, crée le compte (email de substitution si déjà pris ou non vérifié)
  if (!user) {
    const base = profile.username.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 28) || "lecteur";
    let username = base;
    let n = 2;
    while (await prisma.user.findUnique({ where: { username } })) username = `${base}_${n++}`;
    const emailFree = email && !(await prisma.user.findUnique({ where: { email } }));
    user = await prisma.user.create({
      data: {
        hubId: profile.sub,
        email: emailFree ? email : `${profile.sub}@hub.local`,
        username,
        role: "USER",
      },
    });
  }

  await createSession({ sub: user.id, role: user.role, username: user.username });
  const res = NextResponse.redirect(new URL(next, APP_URL));
  res.cookies.delete(SSO_COOKIE);
  return res;
}
