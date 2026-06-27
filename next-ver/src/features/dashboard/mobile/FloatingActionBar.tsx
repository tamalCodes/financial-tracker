"use client";

import type { SheetMode } from "./data";

// Floating action bar — pixel from FinanceDashboard.dc.html (handoff §5.5).
// Fixed bottom-centre frosted pill; 3 circular icon-only buttons. Respects safe-area.
interface Props {
  onOpen: (mode: SheetMode) => void;
}

interface FabProps {
  label: string;
  onClick: () => void;
  gradient: string;
  border: string;
  stroke: string;
  children: React.ReactNode;
}

function Fab({ label, onClick, gradient, border, stroke, children }: FabProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 50,
        height: 50,
        borderRadius: 999,
        background: gradient,
        border: `1px solid ${border}`,
      }}
    >
      <svg width="21" height="21" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

export default function FloatingActionBar({ onOpen }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "calc(env(safe-area-inset-bottom) + 34px)",
        zIndex: 40,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(18px) saturate(1.8)",
          WebkitBackdropFilter: "blur(18px) saturate(1.8)",
          border: "1px solid rgba(226,232,240,0.95)",
          borderRadius: 999,
          padding: 9,
          boxShadow: "0 22px 48px -14px rgba(15,23,42,0.45), 0 2px 8px rgba(15,23,42,0.06)",
        }}
      >
        <Fab
          label="Add expense"
          onClick={() => onOpen("expense")}
          gradient="linear-gradient(135deg,rgba(239,68,68,0.26),rgba(239,68,68,0.13))"
          border="rgba(239,68,68,0.42)"
          stroke="#b91c1c"
        >
          <path d="M10 4v12" />
          <path d="M5 11l5 5 5-5" />
        </Fab>
        <Fab
          label="Add income"
          onClick={() => onOpen("income")}
          gradient="linear-gradient(135deg,rgba(16,185,129,0.28),rgba(16,185,129,0.14))"
          border="rgba(16,185,129,0.45)"
          stroke="#047857"
        >
          <path d="M10 16V4" />
          <path d="M5 9l5-5 5 5" />
        </Fab>
        <Fab
          label="Add investment"
          onClick={() => onOpen("investment")}
          gradient="linear-gradient(135deg,rgba(139,92,246,0.26),rgba(139,92,246,0.13))"
          border="rgba(139,92,246,0.42)"
          stroke="#6d28d9"
        >
          <path d="M3 14l5-5 3 3 6-7" />
          <path d="M14 5h4v4" />
        </Fab>
      </div>
    </div>
  );
}
