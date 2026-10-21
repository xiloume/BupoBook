// Client « Se connecter avec BupoHub » : code d'autorisation + échange serveur.
const HUB_URL = process.env.BUPOHUB_URL ?? "https://bupohub.fr";
export const APP_URL = process.env.APP_URL ?? "http://localhost:8520";

export const HUB_CLIENT_ID = process.env.BUPOHUB_CLIENT_ID ?? "";
const HUB_CLIENT_SECRET = process.env.BUPOHUB_CLIENT_SECRET ?? "";

export const hubConfigured = Boolean(HUB_CLIENT_ID && HUB_CLIENT_SECRET);

export const HUB_CALLBACK_URL = `${APP_URL}/api/auth/hub/callback`;

export function hubAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: HUB_CLIENT_ID,
    redirect_uri: HUB_CALLBACK_URL,
    state,
  });
  return `${HUB_URL}/api/sso/authorize?${params.toString()}`;
}

export type HubProfile = {
  sub: string;
  username: string;
  displayName: string | null;
  email: string;
  emailVerified?: boolean;
  avatarUrl: string | null;
  hasServiceAccess: boolean;
};

export async function exchangeHubCode(code: string): Promise<HubProfile | null> {
  try {
    const res = await fetch(`${HUB_URL}/api/sso/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: HUB_CLIENT_ID, client_secret: HUB_CLIENT_SECRET, code }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as HubProfile;
  } catch {
    return null;
  }
}
