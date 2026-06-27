"use client";

import { LucideIcon } from "lucide-react";

interface ToggleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

/**
 * Tappable card with a leading icon, copy, and a trailing switch. Used for
 * boolean options like "carry forward" — replaces the bare checkbox so every
 * form reads the same way.
 */
export default function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: ToggleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex w-full items-center gap-3 rounded-control border px-4 py-3 text-left transition-colors ${
        checked
          ? "border-indigo-200 bg-indigo-50/60"
          : "border-line bg-field hover:bg-slate-100/70"
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors ${
          checked ? "bg-indigo-100 text-accent-strong" : "bg-surface text-faint"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        <span className="block text-xs text-faint">{description}</span>
      </span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-pill transition-colors ${
          checked ? "bg-accent" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-pill bg-surface shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
