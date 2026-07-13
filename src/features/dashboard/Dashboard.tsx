"use client";

import { useMediaQuery } from "@/features/dashboard/hooks/useMediaQuery";
import MobileHome from "@/features/dashboard/mobile/MobileHome";
import DesktopHome from "@/features/dashboard/desktop/DesktopHome";

// Fluid responsiveness (specs/features/desktop-dashboard.md): the phone UI on mobile,
// a two-column dashboard on desktop / tablet-landscape. The breakpoint is JS-driven
// (components use inline styles, so CSS media queries can't reflow them cleanly) and
// SSR-safe — useMediaQuery defaults to false, so mobile renders on the server and the
// first client paint, avoiding a desktop flash on phones + hydration mismatch.
export default function Dashboard() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return isDesktop ? <DesktopHome /> : <MobileHome />;
}
