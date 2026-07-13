import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

export interface AppControl {
  /** Unix seconds. A session whose JWT `iat` is older than this is force-killed. */
  sessionEpoch: number;
  /** Bumped to make every client wipe service workers + caches and reload. */
  purgeVersion: number;
}

// The kill switch is read on the hot auth path (every requireUser), so cache it
// briefly in memory. The TTL is short enough that flipping the DB flag takes
// effect within seconds, long enough that we don't hit the DB on every request.
// Per-instance on serverless — each cold instance refreshes independently, which
// is fine for a kill switch that only needs to converge within a few seconds.
const TTL_MS = 30_000;
let cache: { value: AppControl; at: number } | null = null;

export async function getAppControl(): Promise<AppControl> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;

  try {
    // app_control isn't in the generated Database types; use an untyped client
    // for this single singleton read rather than hand-editing generated types.
    const db = supabaseServer as unknown as SupabaseClient;
    const { data } = await db
      .from("app_control")
      .select("session_epoch, purge_version")
      .eq("id", 1)
      .single();

    const value: AppControl = {
      sessionEpoch: Number(data?.session_epoch ?? 0),
      purgeVersion: Number(data?.purge_version ?? 0),
    };
    cache = { value, at: now };
    return value;
  } catch {
    // Fail OPEN: a transient DB error must never lock every user out. Reuse the
    // last known value if we have one, otherwise treat as "no kill, no purge".
    const value = cache?.value ?? { sessionEpoch: 0, purgeVersion: 0 };
    cache = { value, at: now };
    return value;
  }
}

export async function getSessionEpoch(): Promise<number> {
  return (await getAppControl()).sessionEpoch;
}
