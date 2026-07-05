"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { DISPLAY } from "./data";

// AmountField — the AI-style inline-calculator amount input, shared by AddSheet
// and EditSheet so both fields behave identically. Type an expression like
// "900 + 300"; after a typing pause it "thinks" then counts up to the result and
// pushes the final integer to the parent (which only ever stores digits).

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
      while (ops.length && prec[ops[ops.length - 1]] >= prec[tk])
        out.push(ops.pop()!);
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
// design system; injected once inside the field.
const AI_CSS = `
@keyframes aiSweep { 0% { transform: translateX(-140%); } 100% { transform: translateX(240%); } }
@keyframes aiPulse { 0%, 100% { opacity: .45; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.12); } }
@keyframes aiPop { 0% { transform: scale(.94); } 45% { transform: scale(1.05); } 100% { transform: scale(1); } }
@keyframes aiDot { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
.amt-input::placeholder { font-size: 15px; font-weight: 500; letter-spacing: 0; color: var(--c-line-strong); }
`;

type CalcPhase = "idle" | "think" | "reveal";

interface Props {
  amount: string; // parent-held digits
  onAmount: (v: string) => void;
  placeholder?: string;
  prefix?: string; // e.g. "₹"
  autoFocus?: boolean;
  onCalcActiveChange?: (active: boolean) => void; // parent disables Save while true
  onFocusChange?: (focused: boolean) => void; // parent swaps its CTA for the operator bar
}

// Imperative handle so a parent-rendered OperatorBar can splice operators into
// the field (the bar lives in the sheet's CTA slot, not inside this component).
export interface AmountFieldHandle {
  insertOp: (op: string) => void;
  // Programmatically run the AI think→reveal sequence to a computed value
  // (e.g. EMI monthly = total ÷ months). No-op if already animating.
  revealValue: (n: number) => void;
}

const AmountField = forwardRef<AmountFieldHandle, Props>(function AmountField(
  {
    amount,
    onAmount,
    placeholder = "Try 900 + 300",
    prefix,
    autoFocus,
    onCalcActiveChange,
    onFocusChange,
  },
  ref,
) {
  // `expr` is the local, operator-capable draft shown in the field. The parent
  // only ever receives sanitised digits, so the arithmetic lives here and pushes
  // up the final number.
  const [expr, setExpr] = useState(amount);
  const [phase, setPhase] = useState<CalcPhase>("idle");
  const [display, setDisplay] = useState<number | null>(null); // count-up value
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null); // typing pause
  const seqRef = useRef<ReturnType<typeof setTimeout> | null>(null); // think→reveal/settle
  const rafRef = useRef<number | null>(null); // count-up frames
  const calcActive = phase !== "idle";

  // Let the parent gate its Save button while a calculation is animating.
  useEffect(() => {
    onCalcActiveChange?.(calcActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcActive]);

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
    // Wait for a real typing pause (~0.9s) before assuming the expression is
    // complete — short debounces fire mid-number (e.g. "900+3" before "…300").
    debounceRef.current = setTimeout(() => startThink(result), 900);
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
    [],
  );

  function handleAmount(v: string) {
    // allow digits + arithmetic while composing; strip everything else
    const cleaned = v.replace(/[^0-9+\-*/×x.\s]/g, "");
    setExpr(cleaned);
    // plain number → keep the parent in sync so Save works immediately
    if (!/[+\-*/×x]/.test(cleaned)) onAmount(cleaned);
  }

  // Mobile numeric keypads don't expose + − × ÷, so these chips splice the
  // operator in at the caret, keep focus, and drop the caret just after it.
  function insertOp(op: string) {
    if (calcActive) return;
    const el = inputRef.current;
    const start = el?.selectionStart ?? expr.length;
    const end = el?.selectionEnd ?? expr.length;
    const next = expr.slice(0, start) + op + expr.slice(end);
    handleAmount(next);
    // restore caret after React re-renders the controlled value
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const pos = start + op.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(pos, pos);
    });
  }

  function revealValue(n: number) {
    if (calcActive) return; // don't interrupt an in-flight animation
    if (!Number.isFinite(n) || n <= 0) return;
    startThink(Math.round(n));
  }

  useImperativeHandle(ref, () => ({ insertOp, revealValue }));

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: `1px solid ${calcActive ? "rgba(79,70,229,0.55)" : "var(--c-line)"}`,
        borderRadius: 16,
        padding: "0 16px",
        height: 62,
        overflow: "hidden",
        background: calcActive ? "var(--c-surface)" : "var(--c-faint)",
        boxShadow: "none",
        transition: "border-color .35s ease, background .35s ease",
      }}
    >
      <style>{AI_CSS}</style>

      {/* Sweeping shimmer while "thinking" */}
      {phase === "think" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
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

      {prefix && (
        <span
          style={{
            position: "relative",
            zIndex: 1,
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 26,
            color: calcActive ? "var(--c-accent-4)" : "var(--c-muted)",
            flexShrink: 0,
            transition: "color .4s ease",
          }}
        >
          {prefix}
        </span>
      )}

      <input
        ref={inputRef}
        value={
          phase === "reveal" && display != null
            ? display.toLocaleString("en-IN")
            : expr
        }
        onChange={(e) => handleAmount(e.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        readOnly={calcActive}
        inputMode="numeric"
        className="amt-input"
        autoFocus={autoFocus}
        placeholder={placeholder}
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
              ? "var(--c-accent-4)"
              : phase === "reveal"
                ? "var(--c-accent-2)"
                : "var(--c-ink)",
          width: "100%",
          fontVariantNumeric: "tabular-nums",
          textShadow:
            phase === "reveal" ? "0 0 22px rgba(79,70,229,0.40)" : "none",
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
            color: "var(--c-accent-2)",
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
                  background: "var(--c-accent-2)",
                  animation: `aiDot 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );
});

export default AmountField;

// OperatorBar — the glassy + − × ÷ row a sheet drops into its CTA slot while the
// Amount field is focused (replacing the Save button). Frosted indigo-translucent
// per the design system — never an opaque saturated fill. No "Done" button:
// blurring the field (tap another control) swaps the Save button back in.
// onPointerDown preventDefault keeps the field focused so the tap actually lands.
export function OperatorBar({ onOp }: { onOp: (op: string) => void }) {
  const ops = [
    { label: "+", op: "+" },
    { label: "−", op: "-" },
    { label: "×", op: "*" },
    { label: "÷", op: "/" },
  ];
  return (
    <div
      onPointerDown={(e) => e.preventDefault()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 54,
        fontFamily: DISPLAY,
      }}
    >
      {ops.map(({ label, op }) => (
        <button
          key={op}
          type="button"
          onClick={() => onOp(op)}
          style={{
            flex: 1,
            height: "100%",
            borderRadius: 16,
            border: "1px solid rgba(79,70,229,0.18)",
            background:
              "linear-gradient(180deg, rgba(99,102,241,0.10), rgba(79,70,229,0.06))",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "var(--c-accent-2)",
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1,
            cursor: "pointer",
            padding: 0,
            boxShadow: "inset 0 1px 0 var(--c-glass)",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
