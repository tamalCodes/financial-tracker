"use client";

import { BODY, DISPLAY } from "./data";
import Skeleton from "./Skeleton";

// "Left in bank" card — pixel from HeroBalance.dc.html (handoff §5.1).
interface Props {
  net: string;
  month: string;
  earned: string;
  spent: string;
  invested: string;
  onPrev: () => void;
  onNext: () => void;
  loading?: boolean;
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";
const TILE_INSET = "inset 0 1px 0 var(--c-glass), 0 1px 2px rgba(15,23,42,0.04)";

interface TileProps {
  label: string;
  value: string;
  gradient: string;
  border: string;
  labelColor: string;
  valueColor: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatTile({ label, value, gradient, border, labelColor, valueColor, icon, loading }: TileProps) {
  return (
    <div
      style={{
        background: gradient,
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: "13px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        backdropFilter: "blur(14px) saturate(1.7)",
        WebkitBackdropFilter: "blur(14px) saturate(1.7)",
        boxShadow: TILE_INSET,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          font: `600 11.5px ${DISPLAY}`,
          color: labelColor,
        }}
      >
        {icon}
        {label}
      </span>
      {loading ? (
        <Skeleton width={52} height={17} />
      ) : (
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 16.5,
            letterSpacing: "-0.02em",
            color: valueColor,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ₹{value}
        </span>
      )}
    </div>
  );
}

function ArrowUp({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14V4" />
      <path d="M6 8l4-4 4 4" />
    </svg>
  );
}
function ArrowDown({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6v10" />
      <path d="M6 12l4 4 4-4" />
    </svg>
  );
}
function TrendUp({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14l5-5 3 3 6-7" />
      <path d="M14 5h4v4" />
    </svg>
  );
}

function StepBtn({ onClick, label, d }: { onClick: () => void; label: string; d: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        cursor: "pointer",
        width: 22,
        height: 22,
        border: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );
}

export default function HeroBalance({ net, month, earned, spent, invested, onPrev, onNext, loading }: Props) {
  return (
    <div
      style={{
        fontFamily: BODY,
        background: "var(--c-surface)",
        border: "1px solid var(--c-line)",
        borderRadius: 26,
        boxShadow: CARD_SHADOW,
        padding: "18px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ font: `500 13px ${BODY}`, letterSpacing: "0.01em", color: "var(--c-body-2)" }}>
          Left in bank
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StepBtn onClick={onPrev} label="Previous month" d="M12 5l-5 5 5 5" />
          <span
            style={{
              font: `600 13px ${DISPLAY}`,
              color: "var(--c-ink-2)",
              minWidth: 54,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {month.split(" ")[0]}
          </span>
          <StepBtn onClick={onNext} label="Next month" d="M8 5l5 5-5 5" />
        </div>
      </div>

      {loading ? (
        <Skeleton width={170} height={36} radius={10} />
      ) : (
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 36,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "var(--c-ink)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ₹{net}
        </span>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 2 }}>
        <StatTile
          label="Earned"
          value={earned}
          gradient="linear-gradient(135deg,rgba(16,185,129,0.30),rgba(16,185,129,0.15))"
          border="rgba(16,185,129,0.45)"
          labelColor="var(--c-credit)"
          valueColor="var(--c-credit-2)"
          icon={<ArrowUp color="var(--c-credit)" />}
          loading={loading}
        />
        <StatTile
          label="Spent"
          value={spent}
          gradient="linear-gradient(135deg,rgba(239,68,68,0.26),rgba(239,68,68,0.13))"
          border="rgba(239,68,68,0.42)"
          labelColor="var(--c-expense)"
          valueColor="var(--c-expense-2)"
          icon={<ArrowDown color="var(--c-expense)" />}
          loading={loading}
        />
        <StatTile
          label="Invested"
          value={invested}
          gradient="linear-gradient(135deg,rgba(139,92,246,0.26),rgba(139,92,246,0.13))"
          border="rgba(139,92,246,0.42)"
          labelColor="var(--c-violet)"
          valueColor="var(--c-violet-2)"
          icon={<TrendUp color="var(--c-violet)" />}
          loading={loading}
        />
      </div>
    </div>
  );
}
