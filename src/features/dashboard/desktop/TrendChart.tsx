"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/api/trend";
import type { TrendWindow } from "@/features/dashboard/hooks/useTrendData";
import { BODY, DISPLAY, fmt, fmtCompact } from "@/features/dashboard/mobile/data";

// Card idiom mirrors the mobile cards (Bills.tsx).
const CARD_SHADOW =
  "0 1px 2px rgba(32,27,19,0.04), 0 14px 30px -22px rgba(32,27,19,0.30)";

// Money-model colors (DESIGN_SYSTEM): credit=green, expense=red, investment=purple.
const SERIES = [
  { key: "earned", label: "Earned", color: "var(--c-credit-3)" },
  { key: "spent", label: "Spent", color: "var(--c-expense-3)" },
  { key: "invested", label: "Invested", color: "var(--c-violet-3)" },
] as const;

// 'YYYY-MM-01' → 'Jun' (or 'Jun 26' at year boundaries would be nicer, but the axis
// stays terse — short month is enough across a 6/12-month window).
const monthShort = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
};

interface ChartRow extends TrendPoint {
  label: string;
}

// Deterministic, organic-looking sample series for the locked (no-data) state.
// Blurred behind the "unlock" overlay so the card teases what the real chart
// becomes once the user logs something — never real numbers, always the same shape.
const SAMPLE_SHAPE = [
  { earned: 62, spent: 38, invested: 14 },
  { earned: 71, spent: 44, invested: 18 },
  { earned: 58, spent: 49, invested: 12 },
  { earned: 84, spent: 41, invested: 26 },
  { earned: 77, spent: 55, invested: 21 },
  { earned: 96, spent: 47, invested: 33 },
  { earned: 68, spent: 52, invested: 19 },
  { earned: 89, spent: 40, invested: 28 },
  { earned: 103, spent: 58, invested: 36 },
  { earned: 74, spent: 46, invested: 22 },
  { earned: 91, spent: 53, invested: 30 },
  { earned: 110, spent: 61, invested: 41 },
];

const samplePlaceholder = (n: number): ChartRow[] =>
  Array.from({ length: n }, (_, i) => {
    const s = SAMPLE_SHAPE[i % SAMPLE_SHAPE.length];
    return {
      month: `2000-${String((i % 12) + 1).padStart(2, "0")}-01`,
      label: monthShort(`2000-${String((i % 12) + 1).padStart(2, "0")}-01`),
      earned: s.earned * 1000,
      spent: s.spent * 1000,
      invested: s.invested * 1000,
    };
  });

function WindowToggle({
  value,
  onChange,
}: {
  value: TrendWindow;
  onChange: (w: TrendWindow) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: 2,
        background: "var(--c-field)",
        borderRadius: 999,
      }}
    >
      {([6, 12] as TrendWindow[]).map((w) => {
        const active = w === value;
        return (
          <button
            key={w}
            onClick={() => onChange(w)}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: 999,
              padding: "5px 13px",
              font: `600 12px ${DISPLAY}`,
              color: active ? "var(--c-accent)" : "var(--c-muted)",
              background: active ? "var(--c-surface)" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(32,27,19,0.10)" : "none",
              transition: "color 120ms",
            }}
          >
            {w}M
          </button>
        );
      })}
    </div>
  );
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--c-glass-strong)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid var(--c-line)",
        borderRadius: 14,
        padding: "10px 12px",
        boxShadow: "0 12px 30px -14px rgba(32,27,19,0.35)",
        minWidth: 130,
      }}
    >
      <div style={{ font: `600 11px ${DISPLAY}`, color: "var(--c-muted)", marginBottom: 6 }}>
        {label}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "2px 0",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              font: `500 12px ${BODY}`,
              color: "var(--c-body)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: entry.color,
              }}
            />
            {SERIES.find((s) => s.key === entry.dataKey)?.label ?? entry.dataKey}
          </span>
          <span
            style={{
              font: `600 12px ${DISPLAY}`,
              color: "var(--c-ink)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₹{fmt(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  series: TrendPoint[];
  loading: boolean;
  error: boolean;
  window: TrendWindow;
  onWindow: (w: TrendWindow) => void;
}

export default function TrendChart({ series, loading, error, window, onWindow }: Props) {
  const data: ChartRow[] = useMemo(
    () => series.map((p) => ({ ...p, label: monthShort(p.month) })),
    [series]
  );
  // No point plotting a flat zero line — show an encouraging empty state instead.
  const hasData = useMemo(
    () => data.some((d) => d.earned > 0 || d.spent > 0 || d.invested > 0),
    [data]
  );

  return (
    <div
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-line)",
        borderRadius: 28,
        boxShadow: CARD_SHADOW,
        padding: "22px 22px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "var(--c-ink)" }}>
            Monthly trend
          </span>
          <span style={{ font: `500 11.5px ${BODY}`, color: "var(--c-muted)" }}>
            Earned, spent and invested over time
          </span>
        </div>
        {/* Window toggle only makes sense once there's data to window over. */}
        {hasData && !loading && !error && (
          <WindowToggle value={window} onChange={onWindow} />
        )}
      </div>

      {/* Legend — only meaningful once the chart is unlocked. */}
      {hasData && !loading && !error && (
      <div style={{ display: "flex", gap: 16 }}>
        {SERIES.map((s) => (
          <span
            key={s.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              font: `500 12px ${BODY}`,
              color: "var(--c-body)",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 999, background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      )}

      <div style={{ height: 240, position: "relative" }}>
        {error ? (
          <Centered text="Couldn’t load the trend." />
        ) : loading ? (
          <Centered text="Loading trend…" />
        ) : !hasData ? (
          <LockedPreview window={window} />
        ) : (
          <TrendArea rows={data} interactive />
        )}
      </div>
    </div>
  );
}

// The stacked-area chart itself. `interactive={false}` (locked preview) drops the
// tooltip so the blurred teaser can't be probed for its fake numbers.
function TrendArea({ rows, interactive }: { rows: ChartRow[]; interactive?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
        <defs>
          {SERIES.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--c-field)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--c-muted)", fontSize: 11, fontFamily: "Geist" }}
          dy={6}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fill: "var(--c-muted)", fontSize: 11, fontFamily: "Geist" }}
          tickFormatter={(v: number) => `₹${fmtCompact(v)}`}
        />
        {interactive && (
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--c-line-strong)", strokeDasharray: "3 3" }}
          />
        )}
        {SERIES.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            dot={false}
            isAnimationActive={interactive}
            activeDot={interactive ? { r: 4, strokeWidth: 2, stroke: "var(--c-onaccent)" } : false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// No-data state: a blurred sample chart teasing what the real one becomes, behind a
// glass "unlock" prompt. Beats a flat zero line or a bare text placeholder.
function LockedPreview({ window }: { window: TrendWindow }) {
  const sample = useMemo(() => samplePlaceholder(window), [window]);
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          filter: "blur(5px)",
          opacity: 0.55,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <TrendArea rows={sample} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            maxWidth: 320,
            textAlign: "center",
            background: "var(--c-glass-strong)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid var(--c-line)",
            borderRadius: 18,
            padding: "18px 22px",
            boxShadow: "0 12px 34px -18px rgba(32,27,19,0.4)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "var(--c-field)",
              color: "var(--c-accent)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span style={{ font: `600 14px ${DISPLAY}`, color: "var(--c-ink)" }}>
            Your trend is locked
          </span>
          <span style={{ font: `500 12.5px ${BODY}`, color: "var(--c-muted)", lineHeight: 1.5 }}>
            Log some income, spends or investments and this chart unlocks with your real numbers.
          </span>
        </div>
      </div>
    </>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: `500 13px ${BODY}`,
        color: "var(--c-muted)",
        textAlign: "center",
        padding: "0 24px",
        lineHeight: 1.5,
      }}
    >
      <span style={{ maxWidth: 340 }}>{text}</span>
    </div>
  );
}
