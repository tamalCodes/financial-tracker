"use client";

import { useEffect, useRef, useState } from "react";
import {
  evaluateExpression,
  isCalculation,
} from "@/features/dashboard/utils/expression";

interface AmountInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

// Auto-resolve timing (tuned in mcp__visualize). Calc + reveal ≈ 740ms — snappy,
// nothing like the old ~1.75s "thinking" beat removed in DECISIONS D9.
const RESOLVE_DELAY = 600; // debounce after the last keystroke before resolving
const CALC_DURATION = 350; // Phase A — "Calculating…" shimmer
const REVEAL_DURATION = 250; // Phase B — count-up tween prev→result
type Phase = "idle" | "calculating" | "revealing";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const decimalsOf = (n: number) => {
  const s = n.toString();
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** True if the trimmed input ends on an operator (mid-token, don't resolve yet). */
const hasTrailingOperator = (input: string) =>
  /[+\-*/×÷x]$/i.test(input.trim());

/**
 * ₹-prefixed amount field that accepts arithmetic ("900+300"). After a short
 * debounce it auto-resolves to the total ("1200") *while focused* — a brief
 * "Calculating…" shimmer, then a count-up reveal — without needing a blur. Blur
 * still resolves instantly. Honours `prefers-reduced-motion` (sets the value
 * directly, no animation). See DESIGN_SYSTEM.md / DECISIONS D9.
 */
export default function AmountInput({
  id,
  value,
  onChange,
  autoFocus,
  placeholder = "0.00",
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("");
  // While revealing, the input shows this count-up string instead of `value`;
  // `value` (the expression) is only committed via onChange when the tween ends.
  const [display, setDisplay] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calcRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  // Set true right before we commit our own result, so the value-change effect
  // knows the change came from us (and just restores the caret to the end).
  const committingRef = useRef(false);

  const cancelTimers = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (calcRef.current) clearTimeout(calcRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    debounceRef.current = calcRef.current = null;
    rafRef.current = null;
  };

  const resetPhase = () => {
    setPhase("idle");
    setStatus("");
    setDisplay(null);
  };

  // Move the caret to the end without stealing/scrolling. Keeps focus intact.
  const caretToEnd = () => {
    const el = inputRef.current;
    if (!el) return;
    const len = el.value.length;
    el.setSelectionRange(len, len);
  };

  // Autofocus on mount with the caret *after* any prefilled value (e.g. "930"),
  // not a full selection — so the blinking caret shows where typing continues.
  useEffect(() => {
    if (!autoFocus) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-resolve, re-armed on every keystroke.
  useEffect(() => {
    // Our own committed result flows back here — just restore the caret to the
    // end of the new value (skip the cancel/reset meant for user edits).
    if (committingRef.current) {
      committingRef.current = false;
      caretToEnd();
      return;
    }

    cancelTimers();
    resetPhase();

    if (
      !isCalculation(value) ||
      hasTrailingOperator(value) // mid-token, wait for more input
    ) {
      return;
    }
    const result = evaluateExpression(value);
    if (result === null || result.toString() === value.trim()) return;

    debounceRef.current = setTimeout(() => {
      if (prefersReducedMotion()) {
        commit(result);
        return;
      }
      startCalculating(result);
    }, RESOLVE_DELAY);

    return cancelTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Cleanup on unmount.
  useEffect(() => cancelTimers, []);

  // Commit the result to the parent (the single onChange of the whole sequence).
  const commit = (result: number) => {
    committingRef.current = true;
    onChange(result.toString());
  };

  // Phase A — shimmer + "Calculating…".
  const startCalculating = (result: number) => {
    setPhase("calculating");
    setStatus("Calculating…");
    calcRef.current = setTimeout(() => startReveal(result), CALC_DURATION);
  };

  // Phase B — count-up tween, then commit.
  const startReveal = (result: number) => {
    setStatus("");
    setPhase("revealing");
    const decimals = decimalsOf(result);
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / REVEAL_DURATION);
      setDisplay((result * easeOut(p)).toFixed(decimals));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      // Land exactly on the result, commit, caret back to end (committing branch).
      setDisplay(null);
      setPhase("idle");
      commit(result);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Blur still resolves immediately (the original instant path).
  const handleBlur = () => {
    cancelTimers();
    resetPhase();
    if (!isCalculation(value)) return;
    const result = evaluateExpression(value);
    if (result === null || result.toString() === value.trim()) return;
    onChange(result.toString());
  };

  const calculating = phase === "calculating";

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-slate-400">
          ₹
        </span>
        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={display ?? value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-9 pr-4 text-2xl font-semibold tabular-nums text-slate-900 caret-indigo-500 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white"
        />
        {calculating && (
          <span
            aria-hidden="true"
            className="amount-sweep pointer-events-none absolute inset-0 rounded-xl"
            style={{
              backgroundImage:
                "linear-gradient(100deg, transparent 30%, rgb(99 102 241 / 0.14) 50%, transparent 70%)",
              backgroundSize: "220% 100%",
              animation: `amount-sweep ${CALC_DURATION}ms ease-out`,
            }}
          />
        )}
      </div>

      <p
        aria-live="polite"
        className="mt-2 h-4 text-sm text-indigo-600 tabular-nums"
      >
        {status}
      </p>
    </div>
  );
}
