"use client";

import { useEffect, useRef, useState } from "react";
import {
  BODY,
  DISPLAY,
  NOTE_LABEL,
  NOTE_PLACEHOLDER,
  SHEET_SAVE,
  SHEET_TITLE,
  type Category,
  type CategoryKey,
  type SheetMode,
} from "./data";

// AddSheet — pixel from AddSheet.dc.html (handoff §5.6 + mode matrix §6).
// One sheet, three modes. Category picker shows for expense only.
interface Props {
  mode: SheetMode;
  amount: string;
  note: string;
  cat: CategoryKey;
  cats: Category[];
  isBill: boolean; // expense mode only: route this entry to the bills / EMI ledger
  due: string; // bill due date (free text, optional)
  billKind: "once" | "emi"; // bill sub-mode: one-off bill vs multi-month EMI
  emiTotal: string; // EMI: total loan amount
  emiMonths: string; // EMI: duration in months
  onAmount: (v: string) => void;
  onNote: (v: string) => void;
  onCat: (key: CategoryKey) => void;
  onToggleBill: (v: boolean) => void;
  onDue: (v: string) => void;
  onBillKind: (v: "once" | "emi") => void;
  onEmiTotal: (v: string) => void;
  onEmiMonths: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

// --- Amount "calculator" (AI-style inline math) -----------------------------
// Evaluate a typed arithmetic expression like "900+300" or "900 plus 300".
// Returns the number, or null when the text isn't a complete expression.
// Pure + no eval(): normalise words → symbols, tokenise, shunting-yard, RPN.
function evalExpr(raw: string): number | null {
  const s = raw
    .toLowerCase()
    .replace(/divided by/g, "/")
    .replace(/multiplied by/g, "*")
    .replace(/times/g, "*")
    .replace(/plus/g, "+")
    .replace(/minus/g, "-")
    .replace(/[×x]/g, "*")
    .replace(/[^0-9+\-*/.]/g, "");
  // need an operator that isn't just a leading sign
  if (!/[+\-*/]/.test(s.slice(1))) return null;
  const tokens = s.match(/\d+\.?\d*|[+\-*/]/g);
  if (!tokens || tokens.length < 3) return null;

  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const out: (number | string)[] = [];
  const ops: string[] = [];
  for (const tk of tokens) {
    if (/\d/.test(tk)) {
      out.push(parseFloat(tk));
    } else {
      while (ops.length && prec[ops[ops.length - 1]] >= prec[tk]) out.push(ops.pop()!);
      ops.push(tk);
    }
  }
  while (ops.length) out.push(ops.pop()!);

  const st: number[] = [];
  for (const t of out) {
    if (typeof t === "number") {
      st.push(t);
      continue;
    }
    const b = st.pop();
    const a = st.pop();
    if (a === undefined || b === undefined) return null;
    st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b);
  }
  const r = st[0];
  if (st.length !== 1 || r == null || !Number.isFinite(r)) return null;
  return r;
}

// Keyframes for the "AI is thinking" shimmer + the reveal pop. Indigo-only per
// design system; injected once inside the sheet.
const AI_CSS = `
@keyframes aiSweep { 0% { transform: translateX(-140%); } 100% { transform: translateX(240%); } }
@keyframes aiPulse { 0%, 100% { opacity: .45; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.12); } }
@keyframes aiPop { 0% { transform: scale(.94); } 45% { transform: scale(1.05); } 100% { transform: scale(1); } }
@keyframes aiDot { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
`;

type CalcPhase = "idle" | "think" | "reveal";

function CatPill({
  cat,
  selected,
  onSelect,
}: {
  cat: Category;
  selected: boolean;
  onSelect: () => void;
}) {
  const base: React.CSSProperties = {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    height: 30,
    padding: "0 13px",
    borderRadius: 10,
    fontFamily: DISPLAY,
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1,
  };
  const style: React.CSSProperties = selected
    ? {
        ...base,
        color: cat.text,
        background: `linear-gradient(135deg,rgba(${cat.rgb},0.30),rgba(${cat.rgb},0.15))`,
        border: `1px solid rgba(${cat.rgb},0.50)`,
      }
    : {
        ...base,
        color: "#64748b",
        background: "#fff",
        border: "1px solid #e2e8f0",
      };
  return (
    <button onClick={onSelect} style={style}>
      <span
        style={{
          display: "block",
          flexShrink: 0,
          width: 8,
          height: 8,
          borderRadius: 999,
          background: selected ? cat.text : "#cbd5e1",
        }}
      />
      {cat.label}
    </button>
  );
}

export default function AddSheet({
  mode,
  amount,
  note,
  cat,
  cats,
  isBill,
  due,
  billKind,
  emiTotal,
  emiMonths,
  onAmount,
  onNote,
  onCat,
  onToggleBill,
  onDue,
  onBillKind,
  onEmiTotal,
  onEmiMonths,
  onSave,
  onClose,
}: Props) {
  const [noteFocus, setNoteFocus] = useState(false);
  const [dueFocus, setDueFocus] = useState(false);

  // --- Inline calculator state ---
  // `expr` is the local, operator-capable draft shown in the field. The parent
  // only ever receives sanitised digits (its setAmount strips non-digits), so
  // the arithmetic lives here and pushes up the final number.
  const [expr, setExpr] = useState(amount);
  const [phase, setPhase] = useState<CalcPhase>("idle");
  const [display, setDisplay] = useState<number | null>(null); // count-up value
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null); // typing pause
  const seqRef = useRef<ReturnType<typeof setTimeout> | null>(null); // think→reveal/settle
  const rafRef = useRef<number | null>(null); // count-up frames
  const calcActive = phase !== "idle";

  // Resync the draft when the parent replaces amount (sheet open / reset / edit),
  // but never while we're mid-animation or mid-typing an expression.
  useEffect(() => {
    if (phase === "idle" && amount !== expr.replace(/[^0-9]/g, "")) {
      setExpr(amount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  // Whole sequence stays under ~1s: debounce → think → count-up.
  function startReveal(result: number) {
    setPhase("reveal");
    const target = Math.round(result);
    const dur = 360;
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(target * eased));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        const settled = String(Math.max(0, target));
        onAmount(settled);
        setExpr(settled);
        setDisplay(null);
        // brief glow hold, then settle back to the resting field
        seqRef.current = setTimeout(() => setPhase("idle"), 260);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function startThink(result: number) {
    setPhase("think");
    // seqRef is independent of the detection effect, so a phase change can't
    // clear this timer (the earlier "stuck loading" bug).
    seqRef.current = setTimeout(() => startReveal(result), 380);
  }

  // Watch the draft: once it's a complete expression, pause briefly (so the user
  // has finished typing) then run the think → reveal sequence.
  useEffect(() => {
    if (phase !== "idle") return;
    const result = evalExpr(expr);
    if (result == null) return;
    debounceRef.current = setTimeout(() => startThink(result), 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expr, phase]);

  // Cleanup any pending timers / frames on unmount.
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (seqRef.current) clearTimeout(seqRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  function handleAmount(v: string) {
    // allow digits + arithmetic while composing; strip everything else
    const cleaned = v.replace(/[^0-9+\-*/×x.\s]/g, "");
    setExpr(cleaned);
    // plain number → keep the parent in sync so Save works immediately
    if (!/[+\-*/×x]/.test(cleaned)) onAmount(cleaned);
  }

  const isExpense = mode === "expense";
  const asBill = isExpense && isBill;
  const asEmi = asBill && billKind === "emi";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15,23,42,0.40)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: "30px 30px 0 0",
          boxShadow: "0 -18px 60px -18px rgba(15,23,42,0.45)",
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            padding: "10px 22px calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          <style>{AI_CSS}</style>

          {/* Grabber */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "4px 0 16px",
            }}
          >
            <span
              style={{
                width: 42,
                height: 5,
                borderRadius: 999,
                background: "#e2e8f0",
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 21,
                letterSpacing: "-0.01em",
                color: "#0f172a",
              }}
            >
              {asEmi ? "Add EMI" : asBill ? "Add Bill" : SHEET_TITLE[mode]}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                cursor: "pointer",
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#64748b",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Type toggle (expense only): one flat choice — Expense / Bill / EMI */}
          {isExpense && (
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                marginBottom: 18,
                background: "#f1f5f9",
                borderRadius: 14,
              }}
            >
              {[
                {
                  label: "Expense",
                  on: !isBill,
                  click: () => onToggleBill(false),
                },
                {
                  label: "Bill",
                  on: isBill && billKind === "once",
                  click: () => {
                    onToggleBill(true);
                    onBillKind("once");
                  },
                },
                {
                  label: "EMI",
                  on: isBill && billKind === "emi",
                  click: () => {
                    onToggleBill(true);
                    onBillKind("emi");
                  },
                },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={t.click}
                  style={{
                    cursor: "pointer",
                    flex: 1,
                    height: 40,
                    borderRadius: 10,
                    border: "none",
                    fontFamily: DISPLAY,
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: t.on ? "#4f46e5" : "#64748b",
                    background: t.on ? "#fff" : "transparent",
                    boxShadow: t.on ? "0 1px 3px rgba(15,23,42,0.10)" : "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* EMI details: total loan + duration — sits above the monthly amount */}
          {asEmi && (
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
                  Total amount
                </span>
                <input
                  value={emiTotal}
                  onChange={(e) => onEmiTotal(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="e.g. 32600"
                  style={{
                    width: "100%",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "0 15px",
                    height: 50,
                    fontFamily: BODY,
                    fontSize: 16,
                    color: "#0f172a",
                    background: "#f8fafc",
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 120 }}>
                <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
                  Months
                </span>
                <input
                  value={emiMonths}
                  onChange={(e) => onEmiMonths(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="e.g. 8"
                  style={{
                    width: "100%",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "0 15px",
                    height: 50,
                    fontFamily: BODY,
                    fontSize: 16,
                    color: "#0f172a",
                    background: "#f8fafc",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}

          {/* Amount */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
              {asEmi ? "Monthly amount" : "Amount"}
            </span>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: `1px solid ${
                  calcActive ? "rgba(79,70,229,0.55)" : "#e2e8f0"
                }`,
                borderRadius: 16,
                padding: "0 16px",
                height: 62,
                overflow: "hidden",
                background: calcActive ? "#fbfbff" : "#f8fafc",
                boxShadow: "none",
                transition:
                  "border-color .35s ease, background .35s ease",
              }}
            >
              {/* Sweeping shimmer while "thinking" */}
              {phase === "think" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: "45%",
                      background:
                        "linear-gradient(90deg, transparent, rgba(99,102,241,0.16) 40%, rgba(129,140,248,0.30) 50%, rgba(99,102,241,0.16) 60%, transparent)",
                      filter: "blur(1px)",
                      animation: "aiSweep 1.15s ease-in-out infinite",
                    }}
                  />
                </div>
              )}
              <span
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 26,
                  color: calcActive ? "#818cf8" : "#94a3b8",
                  transition: "color .35s ease",
                  zIndex: 1,
                }}
              >
                ₹
              </span>
              <input
                value={
                  phase === "reveal" && display != null
                    ? display.toLocaleString("en-IN")
                    : expr
                }
                onChange={(e) => handleAmount(e.target.value)}
                readOnly={calcActive}
                inputMode="numeric"
                placeholder="0"
                style={{
                  position: "relative",
                  zIndex: 1,
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 28,
                  letterSpacing: "-0.01em",
                  color:
                    phase === "think"
                      ? "#a5b4fc"
                      : phase === "reveal"
                      ? "#4f46e5"
                      : "#0f172a",
                  width: "100%",
                  fontVariantNumeric: "tabular-nums",
                  textShadow:
                    phase === "reveal"
                      ? "0 0 22px rgba(79,70,229,0.40)"
                      : "none",
                  animation: phase === "reveal" ? "aiPop .55s ease-out" : undefined,
                  transition: "color .4s ease, text-shadow .4s ease",
                }}
              />
              {/* "AI thinking" badge: sparkle + pulsing dots */}
              {phase === "think" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 999,
                    background: "rgba(79,70,229,0.08)",
                    border: "1px solid rgba(79,70,229,0.18)",
                    color: "#4f46e5",
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1,
                      animation: "aiPulse 1.15s ease-in-out infinite",
                    }}
                  >
                    ✦
                  </span>
                  <span style={{ display: "flex", gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 999,
                          background: "#4f46e5",
                          animation: `aiDot 1s ease-in-out ${i * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Category picker (plain expense only — bills have no category) */}
          {isExpense && !isBill && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
                marginBottom: 18,
              }}
            >
              <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
                Category
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {cats.map((c) => (
                  <CatPill
                    key={c.key}
                    cat={c}
                    selected={c.key === cat}
                    onSelect={() => onCat(c.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Note / Source / Fund / (bill) Name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: asBill ? 18 : 22,
            }}
          >
            <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
              {asBill ? "Name" : NOTE_LABEL[mode]}
            </span>
            <input
              value={note}
              onChange={(e) => onNote(e.target.value)}
              onFocus={() => setNoteFocus(true)}
              onBlur={() => setNoteFocus(false)}
              placeholder={
                asBill ? "e.g. Electricity, Car EMI" : NOTE_PLACEHOLDER[mode]
              }
              style={{
                width: "100%",
                border: `1px solid ${noteFocus ? "#818cf8" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: "0 15px",
                height: 50,
                fontFamily: BODY,
                fontSize: 16,
                color: "#0f172a",
                background: "#f8fafc",
                outline: "none",
              }}
            />
          </div>

          {/* Due date (one-off bill only, optional) */}
          {asBill && !asEmi && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 22,
              }}
            >
              <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
                Due date · optional
              </span>
              <input
                value={due}
                onChange={(e) => onDue(e.target.value)}
                onFocus={() => setDueFocus(true)}
                onBlur={() => setDueFocus(false)}
                maxLength={32}
                placeholder="e.g. 5 Jul"
                style={{
                  width: "100%",
                  border: `1px solid ${dueFocus ? "#818cf8" : "#e2e8f0"}`,
                  borderRadius: 14,
                  padding: "0 15px",
                  height: 50,
                  fontFamily: BODY,
                  fontSize: 16,
                  color: "#0f172a",
                  background: "#f8fafc",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Submit — disabled while the amount is still being calculated */}
          <button
            onClick={onSave}
            disabled={calcActive}
            style={{
              cursor: calcActive ? "not-allowed" : "pointer",
              width: "100%",
              height: 54,
              border: "none",
              borderRadius: 16,
              background: "#4f46e5",
              color: "#fff",
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 15.5,
              boxShadow: "0 8px 20px -8px rgba(79,70,229,0.55)",
              opacity: calcActive ? 0.5 : 1,
              transition: "opacity .25s ease",
            }}
          >
            {asEmi ? "Add EMI" : asBill ? "Add Bill" : SHEET_SAVE[mode]}
          </button>
        </div>
      </div>
    </div>
  );
}
