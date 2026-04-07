import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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
    return {
      id: userId,
      email: typeof payload.email === "string" ? payload.email : null,
      accessToken,
    };
  } catch {
    return null;
  }
};
