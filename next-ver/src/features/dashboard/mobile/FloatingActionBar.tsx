"use client";

import type { SheetMode } from "./data";

// Floating action bar — fixed bottom-centre pill; three crisp icon-only actions.
// Opaque surfaces avoid the hazy frosted effect on mobile. Respects safe-area.
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
        width: 42,
        height: 42,
        borderRadius: 999,
        background: gradient,
        border: `1px solid ${border}`,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          gap: 10,
          background: "var(--c-surface)",
          border: "1px solid var(--c-line)",
          borderRadius: 999,
          padding: 7,
        }}
      >
        <Fab
          label="Add expense"
          onClick={() => onOpen("expense")}
          gradient="color-mix(in srgb, var(--c-expense) 18%, var(--c-surface))"
          border="color-mix(in srgb, var(--c-expense) 58%, var(--c-surface))"
          stroke="var(--c-expense)"
        >
          <path d="M10 4v12" />
          <path d="M5 11l5 5 5-5" />
        </Fab>
        <Fab
          label="Add income"
          onClick={() => onOpen("income")}
          gradient="color-mix(in srgb, var(--c-credit) 18%, var(--c-surface))"
          border="color-mix(in srgb, var(--c-credit) 58%, var(--c-surface))"
          stroke="var(--c-credit)"
        >
          <path d="M10 16V4" />
          <path d="M5 9l5-5 5 5" />
        </Fab>
        <Fab
          label="Add investment"
          onClick={() => onOpen("investment")}
          gradient="color-mix(in srgb, var(--c-violet) 18%, var(--c-surface))"
          border="color-mix(in srgb, var(--c-violet) 58%, var(--c-surface))"
          stroke="var(--c-violet)"
        >
          <path d="M3 14l5-5 3 3 6-7" />
          <path d="M14 5h4v4" />
        </Fab>
      </div>
    </div>
  );
}
