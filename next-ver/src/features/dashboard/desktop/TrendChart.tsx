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
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

// Money-model colors (DESIGN_SYSTEM): credit=green, expense=red, investment=purple.
const SERIES = [
  { key: "earned", label: "Earned", color: "#10b981" },
  { key: "spent", label: "Spent", color: "#ef4444" },
  { key: "invested", label: "Invested", color: "#8b5cf6" },
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
        background: "#f1f5f9",
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
              color: active ? "#4338ca" : "#94a3b8",
              background: active ? "#fff" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(15,23,42,0.10)" : "none",
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
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "10px 12px",
        boxShadow: "0 12px 30px -14px rgba(15,23,42,0.35)",
        minWidth: 130,
      }}
    >
      <div style={{ font: `600 11px ${DISPLAY}`, color: "#94a3b8", marginBottom: 6 }}>
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
              color: "#475569",
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
              color: "#0f172a",
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

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
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
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
            Monthly trend
          </span>
          <span style={{ font: `500 11.5px ${BODY}`, color: "#94a3b8" }}>
            Earned, spent and invested over time
          </span>
        </div>
        <WindowToggle value={window} onChange={onWindow} />
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16 }}>
        {SERIES.map((s) => (
          <span
            key={s.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              font: `500 12px ${BODY}`,
              color: "#475569",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 999, background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div style={{ height: 240, position: "relative" }}>
        {error ? (
          <Centered text="Couldn’t load the trend." />
        ) : loading ? (
          <Centered text="Loading trend…" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
              <defs>
                {SERIES.map((s) => (
                  <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Geist" }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Geist" }}
                tickFormatter={(v: number) => `₹${fmtCompact(v)}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
              {SERIES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
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
        color: "#94a3b8",
      }}
    >
      {text}
    </div>
  );
}
