import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api/rateLimit";
import { getAppControl } from "@/lib/api/appControl";
import { getAccessTokenClaims } from "@/lib/supabase/auth";

// Poll target for the client boot service (AppControl.tsx). Reports:
//   killed       — this caller's session was invalidated by the kill switch,
//                  so the client should sign out immediately.
//   purgeVersion — bump it in the DB to make every client wipe its service
//                  worker + caches and reload (evicts the legacy caching SW).
// Holds no secrets; readable with or without a session.
export async function GET(request: Request) {
  const limit = rateLimit(request, "app-control", {
    limit: 120,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
      }
    );
  }

  const { sessionEpoch, purgeVersion } = await getAppControl();
  const claims = await getAccessTokenClaims();
  const killed =
    !!claims && sessionEpoch > 0 && claims.issuedAt < sessionEpoch;

  return NextResponse.json(
    { purgeVersion, killed },
    { headers: { "Cache-Control": "no-store" } }
  );
}
