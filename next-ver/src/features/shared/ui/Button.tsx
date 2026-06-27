"use client";

type Variant = "primary" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "border border-line text-body hover:bg-field disabled:opacity-50",
};

/** Form action button. `primary` for confirm, `secondary` for cancel. */
export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex-1 rounded-control px-4 py-3 text-base font-medium transition-colors ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

/** Row wrapper for a Cancel / Confirm pair. */
export function ButtonRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 flex items-center gap-3">{children}</div>;
}
