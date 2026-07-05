"use client";

import { useEffect } from "react";

// The login / signup pages are always rendered in light mode, regardless of the
// user's theme choice. AuthForm uses hardcoded light (slate/white) classes, and a
// `.dark` <html> class also flips `color-scheme: dark`, which darkens native form
// controls. So we strip `.dark` on mount and restore it on unmount (e.g. after the
// user authenticates and navigates into the themed app).
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  return <>{children}</>;
}
