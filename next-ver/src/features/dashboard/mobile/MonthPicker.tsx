"use client";

import { useEffect, useRef, useState } from "react";
import { BODY, DISPLAY } from "./data";
import { formatMonthKey, parseMonthKey } from "../utils/dates";

// MonthPicker — a month + year selector. Click the field to drop a calendar-style
// popover: a year row (‹ 2026 ›) over a 3×4 grid of month cells. Picking a month
// emits a month key ("YYYY-MM-01"). Used by the EMI "Started" field so a schedule
// can be re-anchored to any past/future month, not just ±1 via a stepper.
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Props {
  value: string; // month key "YYYY-MM-01"
  onChange: (monthKey: string) => void;
}

export default function MonthPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = parseMonthKey(value);
  const selYear = selected.getFullYear();
  const selMonth = selected.getMonth();
  // The year currently paged to in the popover (starts on the selected year).
  const [viewYear, setViewYear] = useState(selYear);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Re-sync the paged year whenever the popover opens on a new value.
  useEffect(() => {
    if (open) setViewYear(selYear);
  }, [open, selYear]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (monthIndex: number) => {
    onChange(formatMonthKey(new Date(viewYear, monthIndex, 1)));
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: `1px solid ${open ? "var(--c-accent-3)" : "var(--c-line)"}`,
          borderRadius: 16,
          background: "var(--c-faint)",
          height: 62,
          padding: "0 18px",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: "-0.01em",
            color: "var(--c-ink)",
          }}
        >
          {MONTHS[selMonth]} {selYear}
        </span>
        <span
          aria-hidden
          style={{
            fontSize: 16,
            color: "var(--c-muted)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .2s ease",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 10,
            background: "var(--c-surface)",
            border: "1px solid var(--c-line)",
            borderRadius: 18,
            boxShadow: "0 18px 50px -18px rgba(15,23,42,0.35)",
            padding: 14,
          }}
        >
          {/* Year pager */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              aria-label="Previous year"
              style={YEAR_BTN}
            >
              ‹
            </button>
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 16,
                color: "var(--c-ink)",
              }}
            >
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              aria-label="Next year"
              style={YEAR_BTN}
            >
              ›
            </button>
          </div>

          {/* Month grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {MONTHS.map((m, i) => {
              const isSel = i === selMonth && viewYear === selYear;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => pick(i)}
                  style={{
                    height: 42,
                    borderRadius: 12,
                    border: isSel
                      ? "1px solid transparent"
                      : "1px solid var(--c-line)",
                    background: isSel ? "var(--c-accent-2)" : "var(--c-faint)",
                    color: isSel ? "var(--c-surface)" : "var(--c-ink-2)",
                    fontFamily: BODY,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const YEAR_BTN: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid rgba(79,70,229,0.18)",
  background: "linear-gradient(180deg, rgba(99,102,241,0.10), rgba(79,70,229,0.06))",
  color: "var(--c-accent-2)",
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1,
  cursor: "pointer",
};
