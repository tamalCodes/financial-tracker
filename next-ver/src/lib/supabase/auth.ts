import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export const getUserFromCookies = async () => {
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
    // full_name rides along in the JWT user_metadata (set at signup), so /me can
    // read the display name without an extra profiles query.
    const meta = (payload.user_metadata ?? {}) as { full_name?: unknown };
    return {
      id: userId,
      email: typeof payload.email === "string" ? payload.email : null,
      fullName: typeof meta.full_name === "string" ? meta.full_name : null,
      accessToken,
    };
  } catch {
    return null;
  }
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
  const localUser = await getUserFromCookies();
  if (localUser?.id) {
    return { userId: localUser.id };
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (authError || !userId) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId };
};
