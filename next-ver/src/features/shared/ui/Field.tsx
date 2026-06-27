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
        className="mb-1.5 block text-sm font-medium text-body"
      >
        {label}
        {hint && <span className="ml-1 font-normal text-faint">{hint}</span>}
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
        className={`w-full rounded-control border border-line bg-field px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-faint focus:border-focus focus:bg-surface ${className}`}
        {...props}
      />
    );
  }
);
