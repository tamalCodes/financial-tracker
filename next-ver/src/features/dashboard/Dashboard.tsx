"use client";

import MobileHome from "@/features/dashboard/mobile/MobileHome";

// Mobile home, rebuilt pixel-for-pixel from the design handoff (next-ver/specs/design-handoff).
// Currently driven by in-memory demo data (mobile/data.ts). Backend wiring comes next —
// the legacy data-fetching components/hooks remain in the repo for that step.
export default function Dashboard() {
  return <MobileHome />;
}
