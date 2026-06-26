"use client";

import { forwardRef } from "react";

interface FieldProps {
  id: string;
  label: string;
  /** Small grey suffix after the label, e.g. "(optional)". */
  hint?: string;
  children: React.ReactNode;
}

/** Label + control wrapper. Consistent label type and spacing across forms. */
export function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-600"
      >
        {label}
        {hint && <span className="ml-1 font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Standard text input. Matches AmountInput / TagInput styling. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white ${className}`}
        {...props}
      />
    );
  }
);
