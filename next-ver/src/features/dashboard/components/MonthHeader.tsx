"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthHeaderProps {
  monthLabel: string;
  isViewingCurrentMonth: boolean;
  canNavigateNextMonth: boolean;
  isRefreshing: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthHeader({
  monthLabel,
  isViewingCurrentMonth,
  canNavigateNextMonth,
  isRefreshing,
  onPrev,
  onNext,
}: MonthHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Viewing
        </p>
        <p className="text-3xl font-heading font-semibold text-slate-900 mt-1">
          {monthLabel}
        </p>
        {!isViewingCurrentMonth && (
          <p className="text-sm text-slate-500 mt-2">
            Adding new entries is disabled for historical months.
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={onPrev}
            className="px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            aria-label="Go to previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNavigateNextMonth}
            className={`px-3 py-2 border-l border-slate-200 transition-colors focus:outline-none ${
              canNavigateNextMonth
                ? "text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-900/20"
                : "text-slate-300 bg-slate-50 cursor-not-allowed"
            }`}
            aria-label="Go to next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {isRefreshing && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-400 animate-ping" />
            Syncing data...
          </div>
        )}
      </div>
    </div>
  );
}
