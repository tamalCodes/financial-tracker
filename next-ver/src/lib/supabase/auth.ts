import { cookies } from "next/headers";
import { decodeJwt, jwtVerify } from "jose";
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

interface AccessTokenClaims {
  id: string;
  email: string | null;
  fullName: string | null;
  accessToken: string;
  /** JWT issued-at, unix seconds. Compared against the kill switch epoch. */
  issuedAt: number;
}

/**
 * Verify the Supabase auth cookie LOCALLY and return its claims — requires
 * SUPABASE_JWT_SECRET. Returns null when the secret is unset (the common case
 * here), so callers must have a secret-free fallback. Kept for the fast path and
 * because it needs no network round-trip.
 */
const getAccessTokenClaims =
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

/** Read a JWT's `iat` (unix seconds) WITHOUT verifying its signature. Safe only
 * for a token whose authenticity was already established elsewhere. Returns 0
 * when absent/unparseable (0 disables the kill check → fail-open). */
const decodeIssuedAt = (token?: string | null): number => {
  if (!token) return 0;
  try {
    const iat = decodeJwt(token).iat;
    return typeof iat === "number" ? iat : 0;
  } catch {
    return 0;
  }
};

export interface AuthContext {
  userId: string;
  email: string | null;
  fullName: string | null;
  /** Token issued-at, unix seconds; 0 if unknown (kill switch then no-ops). */
  issuedAt: number;
}

/**
 * Resolve the authenticated user + token issue time, WITH or WITHOUT
 * SUPABASE_JWT_SECRET:
 *  - secret set  → locally-verified claims (no network).
 *  - secret unset → supabase.auth.getUser() does the crypto verification, then
 *    we decode the (already-authenticated) access token just to read `iat`.
 * Does NOT apply the kill switch — see {@link isSessionKilled} / {@link requireUser}.
 */
export const getAuthContext = async (
  supabase: SupabaseClient
): Promise<AuthContext | null> => {
  const claims = await getAccessTokenClaims();
  if (claims) {
    return {
      userId: claims.id,
      email: claims.email,
      fullName: claims.fullName,
      issuedAt: claims.issuedAt,
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // getSession() reads the token from cookies (no network); getUser() above
  // already authenticated it, so decoding it for `iat` is safe.
  const { data: sessionData } = await supabase.auth.getSession();
  const meta = data.user.user_metadata as { full_name?: unknown } | undefined;
  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    fullName: typeof meta?.full_name === "string" ? meta.full_name : null,
    issuedAt: decodeIssuedAt(sessionData.session?.access_token),
  };
};

/**
 * Kill switch: true when a session was issued before the current session_epoch.
 * Bumping session_epoch in the DB thus invalidates every session minted earlier.
 * issuedAt 0 (unknown) or epoch 0 (default) never kills — fail-open.
 */
export const isSessionKilled = (issuedAt: number, epoch: number) =>
  epoch > 0 && issuedAt > 0 && issuedAt < epoch;

/**
 * Authenticated user with the kill switch applied: null if unauthenticated OR
 * killed. This is the value routes should trust for "who is logged in".
 */
export const getLiveUser = async (
  supabase: SupabaseClient
): Promise<AuthContext | null> => {
  const ctx = await getAuthContext(supabase);
  if (!ctx) return null;
  if (isSessionKilled(ctx.issuedAt, await getSessionEpoch())) return null;
  return ctx;
};

/**
 * Resolve the authenticated user for an API route, enforcing the kill switch.
 * Throws a 401 NextResponse when unauthenticated or killed.
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
  const user = await getLiveUser(supabase);
  if (!user) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: user.userId };
};
