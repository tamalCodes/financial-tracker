"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Accessible label for the close button. */
  closeLabel?: string;
}

/**
 * Shared modal shell. One source of truth for every dialog in the app:
 * - Mobile: full-bleed bottom sheet with a rounded top and home-bar safe area.
 * - Desktop (sm+): centered card, max-w-md.
 * Closes on backdrop click and Escape. Body scrolls if content overflows.
 */
export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  closeLabel = "Close",
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl shadow-slate-900/10 sm:max-w-md sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-1">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-2 -mt-1 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body — safe-area padding keeps actions off the home bar. */}
        <div className="overflow-y-auto px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
