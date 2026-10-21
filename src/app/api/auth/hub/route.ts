import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { hubAuthorizeUrl, hubConfigured, APP_URL } from "@/lib/hub";

const SSO_COOKIE = "bupobook_sso";

/** GET /api/auth/hub?next=/ — lance la connexion via BupoHub. */
export async function GET(req: NextRequest) {
  if (!hubConfigured) {
    return NextResponse.redirect(new URL("/login?error=sso_unavailable", APP_URL));
  }
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(hubAuthorizeUrl(state));
  res.cookies.set(SSO_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_SECURE === "true",
    path: "/",
    maxAge: 300,
  });
  return res;
}
