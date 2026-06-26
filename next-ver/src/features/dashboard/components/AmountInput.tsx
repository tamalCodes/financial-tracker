"use client";

import { useRef } from "react";
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

/**
 * Amount field that accepts arithmetic ("900+300"). When you leave the field
 * (blur), an expression collapses in place to its result ("1200"). Instant —
 * no artificial delay. A quiet hint advertises the feature while idle.
 */
export default function AmountInput({
  id,
  value,
  onChange,
  autoFocus,
  placeholder = "0.00",
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const resolve = () => {
    if (!isCalculation(value)) return;
    const result = evaluateExpression(value);
    if (result === null || result.toString() === value.trim()) return;
    onChange(result.toString());
  };

  const showCalcHint = isCalculation(value) && evaluateExpression(value) !== null;

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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={resolve}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-9 pr-4 text-2xl font-semibold tabular-nums text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      <p className="mt-2 h-4 text-sm text-slate-400">
        {showCalcHint
          ? "We'll total it for you."
          : "Tip: type a sum like 900 + 300."}
      </p>
    </div>
  );
}
