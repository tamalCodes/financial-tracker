"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/theme/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DISPLAY } from "./data";

// Avatar + dropdown menu (shared by MobileHome and DesktopHome). Click the initials
// avatar → glass popover with a Dark mode toggle and Log out. Closes on outside-click
// or Escape. Replaces the previously-inert avatar (issue: no way to sign out).

const ACCENT_AVATAR =
  "linear-gradient(135deg,rgb(var(--c-accent-rgb) / 0.30),rgb(var(--c-accent-rgb) / 0.16))";

interface Props {
  initials: string;
  /** Avatar diameter (mobile 40, desktop 42). */
  size?: number;
}

export default function AvatarMenu({ initials, size = 40 }: Props) {
  const { signOut, user } = useAuth();
  const { resolved, toggle } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isDark = resolved === "dark";

  // Close on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
      router.replace("/auth");
    } catch {
      setBusy(false);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: `600 14px ${DISPLAY}`,
          color: "var(--c-accent)",
          background: ACCENT_AVATAR,
          border: "1px solid rgb(var(--c-accent-rgb) / 0.45)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: size + 10,
            right: 0,
            width: 232,
            zIndex: 60,
            padding: 8,
            borderRadius: 16,
            background: "var(--c-glass-strong)",
            border: "1px solid var(--c-line)",
            backdropFilter: "blur(18px) saturate(1.7)",
            WebkitBackdropFilter: "blur(18px) saturate(1.7)",
            boxShadow: "0 16px 40px rgba(32,27,19,0.18)",
            animation: "none",
          }}
        >
          {user?.email && (
            <div
              style={{
                padding: "6px 10px 8px",
                font: `500 11.5px ${DISPLAY}`,
                color: "var(--c-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                borderBottom: "1px solid var(--c-line)",
                marginBottom: 4,
              }}
            >
              {user.email}
            </div>
          )}

          {/* Dark mode toggle row */}
          <button
            type="button"
            role="menuitem"
            onClick={toggle}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "9px 10px",
              borderRadius: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              font: `600 13px ${DISPLAY}`,
              color: "var(--c-ink)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <MoonIcon />
              Dark mode
            </span>
            <span
              aria-hidden
              style={{
                width: 38,
                height: 22,
                borderRadius: 999,
                flex: "none",
                background: isDark
                  ? "var(--c-accent-2)"
                  : "var(--c-line-strong)",
                position: "relative",
                transition: "background 140ms ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: isDark ? 18 : 2,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "#fff",
                  transition: "left 140ms ease",
                  boxShadow: "0 1px 2px rgba(32,27,19,0.35)",
                }}
              />
            </span>
          </button>

          {/* Log out row */}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={busy}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "9px 10px",
              borderRadius: 10,
              background: "transparent",
              border: "none",
              cursor: busy ? "default" : "pointer",
              font: `600 13px ${DISPLAY}`,
              color: "var(--c-expense)",
              opacity: busy ? 0.6 : 1,
            }}
          >
            <LogoutIcon />
            {busy ? "Signing out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--c-body)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--c-expense)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
