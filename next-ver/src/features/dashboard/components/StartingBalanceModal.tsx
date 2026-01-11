"use client";

import { X } from "lucide-react";

interface StartingBalanceModalProps {
  isOpen: boolean;
  monthLabel: string;
  startingBalanceInput: string;
  startingBalanceError: string;
  updatingStartingBalance: boolean;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function StartingBalanceModal({
  isOpen,
  monthLabel,
  startingBalanceInput,
  startingBalanceError,
  updatingStartingBalance,
  onClose,
  onInputChange,
  onSubmit,
}: StartingBalanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between p-6">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">
              Edit Starting Balance
            </h2>
            <p className="text-md text-slate-500 mt-1">{monthLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close starting balance editor"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="starting-balance"
              className="block text-xl font-sans font-medium text-slate-700 mb-2"
            >
              Starting balance
            </label>
            <input
              id="starting-balance"
              type="number"
              step="0.01"
              min={0}
              value={startingBalanceInput}
              onChange={(e) => onInputChange(e.target.value)}
              required
              autoFocus
              className="w-full text-xl font-sans px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none ring-0"
            />
          </div>

          {startingBalanceError && (
            <p className="text-sm text-red-600">{startingBalanceError}</p>
          )}

          <div className="flex gap-3 pt-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingStartingBalance}
              className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 text-base"
            >
              {updatingStartingBalance ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
