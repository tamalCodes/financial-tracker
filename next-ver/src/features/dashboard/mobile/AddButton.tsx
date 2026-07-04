"use client";

// Contextual "+" button that lives in a card header (desktop dashboard). Each card
// owns its own add-action, so the entry point sits next to the data it creates
// (Recent payments → expense, Bills → bill, EMIs → EMI, Portfolio → investment,
// Income → income). Colour matches the card's transaction semantic. Replaces the
// global FloatingActionBar on desktop — no more content occlusion.
export type AddVariant = "expense" | "income" | "investment" | "bill";

const VARIANTS: Record<AddVariant, { gradient: string; border: string; stroke: string }> = {
  expense: {
    gradient: "linear-gradient(135deg,rgba(239,68,68,0.22),rgba(239,68,68,0.11))",
    border: "rgba(239,68,68,0.40)",
    stroke: "#b91c1c",
  },
  income: {
    gradient: "linear-gradient(135deg,rgba(16,185,129,0.24),rgba(16,185,129,0.12))",
    border: "rgba(16,185,129,0.42)",
    stroke: "#047857",
  },
  investment: {
    gradient: "linear-gradient(135deg,rgba(139,92,246,0.22),rgba(139,92,246,0.11))",
    border: "rgba(139,92,246,0.40)",
    stroke: "#6d28d9",
  },
  bill: {
    gradient: "linear-gradient(135deg,rgba(99,102,241,0.20),rgba(99,102,241,0.10))",
    border: "rgba(99,102,241,0.38)",
    stroke: "#4338ca",
  },
};

interface Props {
  variant: AddVariant;
  label: string;
  onClick: () => void;
}

export default function AddButton({ variant, label, onClick }: Props) {
  const v = VARIANTS[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        cursor: "pointer",
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 999,
        background: v.gradient,
        border: `1px solid ${v.border}`,
        transition: "transform .12s, filter .12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.97)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke={v.stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 4v12" />
        <path d="M4 10h12" />
      </svg>
    </button>
  );
}
