"use client";

import { BODY, DISPLAY } from "./data";

// Greeting header — pixel from FinanceDashboard.dc.html (handoff §4).
// Demo identity (Arjun Kapoor / AK); swap to auth name/initials when wiring backend.
interface Props {
  greeting?: string;
  name?: string;
  initials?: string;
  month: string;
}

const INDIGO_PILL =
  "linear-gradient(135deg,rgba(99,102,241,0.20),rgba(99,102,241,0.10))";
const INDIGO_AVATAR =
  "linear-gradient(135deg,rgba(99,102,241,0.30),rgba(99,102,241,0.16))";

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
        <span style={{ font: `500 12.5px ${BODY}`, color: "#94a3b8" }}>
          {greeting}
        </span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 19,
            letterSpacing: "-0.01em",
            color: "#0f172a",
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
            color: "#4338ca",
            background: INDIGO_PILL,
            border: "1px solid rgba(99,102,241,0.36)",
            borderRadius: 999,
            padding: "6px 11px",
            whiteSpace: "nowrap",
          }}
        >
          {month}
        </span>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            font: `600 14px ${DISPLAY}`,
            color: "#4338ca",
            background: INDIGO_AVATAR,
            border: "1px solid rgba(99,102,241,0.45)",
          }}
        >
          {initials}
        </span>
      </div>
    </div>
  );
}
