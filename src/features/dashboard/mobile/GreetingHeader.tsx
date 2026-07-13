"use client";

import AvatarMenu from "./AvatarMenu";
import { BODY, DISPLAY } from "./data";

// Greeting header — pixel from FinanceDashboard.dc.html (handoff §4).
// Demo identity (Arjun Kapoor / AK); swap to auth name/initials when wiring backend.
interface Props {
  greeting?: string;
  name?: string;
  initials?: string;
  month: string;
}

const ACCENT_PILL =
  "linear-gradient(135deg,rgb(var(--c-accent-rgb) / 0.20),rgb(var(--c-accent-rgb) / 0.10))";

export default function GreetingHeader({
  greeting = "Good evening",
  name = "Arjun Kapoor",
  initials = "AK",
  month,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "calc(8px + env(safe-area-inset-top)) 20px 14px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ font: `500 12.5px ${BODY}`, color: "var(--c-muted)" }}>
          {greeting}
        </span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 19,
            letterSpacing: "-0.01em",
            color: "var(--c-ink)",
          }}
        >
          {name}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            font: `600 12px ${DISPLAY}`,
            color: "var(--c-accent)",
            background: ACCENT_PILL,
            border: "1px solid rgb(var(--c-accent-rgb) / 0.36)",
            borderRadius: 999,
            padding: "6px 11px",
            whiteSpace: "nowrap",
          }}
        >
          {month}
        </span>
        <AvatarMenu initials={initials} size={40} />
      </div>
    </div>
  );
}
