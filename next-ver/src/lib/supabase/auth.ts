import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionEpoch } from "@/lib/api/appControl";

const getProjectRef = () => {
  const url = process.env.SUPABASE_URL ?? "";
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
};

const extractAccessToken = (rawValue: string) => {
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(rawValue);
    if (typeof parsed === "string") return parsed;
    if (parsed?.access_token) return parsed.access_token as string;
    if (parsed?.currentSession?.access_token) {
      return parsed.currentSession.access_token as string;
    }
  } catch {
    return rawValue;
  }
  return rawValue;
};

export interface AccessTokenClaims {
  id: string;
  email: string | null;
  fullName: string | null;
  accessToken: string;
  /** JWT issued-at, unix seconds. Compared against the kill switch epoch. */
  issuedAt: number;
}

/**
 * Verify the Supabase auth cookie and return its claims — WITHOUT applying the
 * kill switch. Used where the token's issue time itself is the question (the
 * /api/app-control endpoint deciding whether THIS session was killed).
 */
export const getAccessTokenClaims =
  async (): Promise<AccessTokenClaims | null> => {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      return null;
    }

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const projectRef = getProjectRef();

    const authCookie =
      (projectRef
        ? allCookies.find(
            (cookie) => cookie.name === `sb-${projectRef}-auth-token`
          )
        : null) ||
      allCookies.find((cookie) => cookie.name === "sb-access-token") ||
      allCookies.find((cookie) => cookie.name.endsWith("-auth-token"));

    if (!authCookie) return null;

    const accessToken = extractAccessToken(authCookie.value);
    if (!accessToken) return null;

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(accessToken, secret);
      const userId = payload.sub;
      if (!userId) return null;
      // full_name rides along in the JWT user_metadata (set at signup), so /me
      // can read the display name without an extra profiles query.
      const meta = (payload.user_metadata ?? {}) as { full_name?: unknown };
      return {
        id: userId,
        email: typeof payload.email === "string" ? payload.email : null,
        fullName: typeof meta.full_name === "string" ? meta.full_name : null,
        accessToken,
        issuedAt: typeof payload.iat === "number" ? payload.iat : 0,
      };
    } catch {
      return null;
    }
  };

/**
 * Kill switch: true when a valid token was issued before the current
 * session_epoch. Bumping session_epoch in the DB thus invalidates every session
 * minted earlier. Epoch 0 (default) never kills anything.
 */
const isKilled = (claims: AccessTokenClaims, epoch: number) =>
  epoch > 0 && claims.issuedAt < epoch;

export const getUserFromCookies = async () => {
  const claims = await getAccessTokenClaims();
  if (!claims) return null;

  if (isKilled(claims, await getSessionEpoch())) return null;

  return {
    id: claims.id,
    email: claims.email,
    fullName: claims.fullName,
    accessToken: claims.accessToken,
  };
};

/**
 * Resolve the authenticated user for an API route.
 * Tries the local JWT cookie first (getUserFromCookies), then falls back to
 * supabase.auth.getUser(). Throws a 401 NextResponse if neither yields a user.
 *
 * Usage (wrap the handler body in try/catch — see specs/CONVENTIONS.md §1):
 *   try {
 *     const supabase = await createSupabaseServerClient();
 *     const { userId } = await requireUser(supabase);
 *     ...
 *   } catch (e) {
 *     if (e instanceof NextResponse) return e;
 *     ...
 *   }
 */
export const requireUser = async (
  supabase: SupabaseClient
): Promise<{ userId: string }> => {
  const claims = await getAccessTokenClaims();
  if (claims) {
    // A valid local token exists — the kill switch is authoritative here. If it
    // was killed we throw 401 and DO NOT fall through, so the Supabase fallback
    // (whose own session cookie is still valid until token expiry) can't
    // resurrect a session we just invalidated.
    if (isKilled(claims, await getSessionEpoch())) {
      throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return { userId: claims.id };
  }

  // No verifiable local token (e.g. SUPABASE_JWT_SECRET unset) — fall back.
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (authError || !userId) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId };
};
