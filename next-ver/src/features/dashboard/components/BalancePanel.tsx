"use client";

import { MonthlyBalance } from "@/features/dashboard/types/types";

interface BalancePanelProps {
  balance: MonthlyBalance | null;
  canEditCurrentMonth: boolean;
  startingBalanceInput: string;
  onStartInputChange: (value: string) => void;
  onSetStartingBalance: (e: React.FormEvent) => void;
  onEditStartingBalance: () => void;
  formatCurrency: (amount: number) => string;
}

export default function BalancePanel({
  balance,
  canEditCurrentMonth,
  startingBalanceInput,
  onStartInputChange,
  onSetStartingBalance,
  onEditStartingBalance,
  formatCurrency,
}: BalancePanelProps) {
  if (!balance) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {canEditCurrentMonth ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Set Starting Balance
            </h2>
            <form onSubmit={onSetStartingBalance} className="space-y-4">
              <input
                type="number"
                step="0.01"
                placeholder="Enter starting balance"
                value={startingBalanceInput}
                onChange={(e) => onStartInputChange(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-base"
              />
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors text-base"
              >
                Set Balance
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              No balance recorded for this month
            </h2>
            <p className="text-sm text-slate-500">
              Switch back to the current month to enter a starting balance.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={onEditStartingBalance}
        disabled={!canEditCurrentMonth}
        className={`bg-white rounded-2xl shadow-sm border p-5 text-left transition-shadow focus:outline-none ${
          canEditCurrentMonth
            ? "border-slate-600 hover:shadow-md focus:ring-2 focus:ring-slate-900/40"
            : "border-slate-200 opacity-60 cursor-not-allowed"
        }`}
        aria-label="Edit starting balance"
      >
        <p className="text-sm font-sans text-slate-600 mb-4">
          Starting Balance
        </p>
        <p className="text-3xl font-heading font-semibold text-slate-900">
          {formatCurrency(balance.starting_balance)}
        </p>
      </button>
      <div className="bg-slate-600 rounded-2xl shadow-sm p-5">
        <p className="text-sm text-slate-200 font-sans mb-4">
          Closing Balance
        </p>
        <p className="text-3xl font-semibold text-white font-heading">
          {formatCurrency(balance.closing_balance)}
        </p>
      </div>
    </div>
  );
}
