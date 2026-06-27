"use client";

import { Trash2 } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/features/dashboard/types/types";
import { formatTxnDate } from "@/features/dashboard/utils/dates";

// "Recent payments" card (mobile handoff §5.2): this month's expenses (debits).
// No minus sign — these are understood to be debits.
interface TransactionsProps {
  expenses: Expense[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: "Food",
  shopping: "Shopping",
  transport: "Transport",
  health: "Health",
  groceries: "Groceries",
  other: "Other",
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

export default function Transactions({
  expenses,
  onSelect,
  onDelete,
}: TransactionsProps) {
  const logged = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div
      className="flex flex-col gap-0.5 rounded-[28px] border border-slate-200 bg-white px-[22px] pb-2.5 pt-[22px]"
      style={{
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)",
      }}
    >
      <div className="flex items-start justify-between gap-3 pb-2">
        <div className="flex flex-col gap-[3px]">
          <span className="font-heading text-[16px] font-semibold text-slate-900">
            Recent payments
          </span>
          <span className="font-body text-xs font-medium text-slate-400">
            {expenses.length} this month · newest first
          </span>
        </div>
        <span
          className="font-heading inline-flex items-center whitespace-nowrap rounded-full border border-red-500/30 px-2.5 py-[5px] text-[11.5px] font-semibold text-red-700 tabular-nums"
          style={{
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.09))",
          }}
        >
          ₹{fmt(logged)}
        </span>
      </div>

      {expenses.length === 0 ? (
        <p className="border-t border-slate-100 py-4 font-body text-[13px] text-slate-400">
          No payments logged this month.
        </p>
      ) : (
        expenses.map((e) => {
          const category = (e.category ?? "other") as ExpenseCategory;
          return (
            <div
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(e.id)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onSelect(e.id);
                }
              }}
              className="group flex items-center justify-between gap-2.5 border-t border-slate-100 py-[11px] outline-none"
            >
              <div className="flex min-w-0 flex-col gap-[5px]">
                <span className="font-body truncate text-sm font-semibold text-slate-900">
                  {e.description}
                </span>
                <div className="flex min-w-0 items-center gap-[7px]">
                  <span
                    className="font-heading flex-none rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{
                      color: `var(--color-cat-${category})`,
                      background: `rgb(var(--cat-${category}) / 0.13)`,
                      border: `1px solid rgb(var(--cat-${category}) / 0.28)`,
                    }}
                  >
                    {CATEGORY_LABEL[category]}
                  </span>
                  <span className="font-body text-[11.5px] font-medium text-slate-400">
                    {e.created_at ? formatTxnDate(e.created_at) : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-none items-center gap-2">
                <span className="font-heading text-sm font-semibold text-red-700 tabular-nums">
                  ₹{fmt(Number(e.amount))}
                </span>
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onDelete(e.id);
                  }}
                  aria-label={`Delete ${e.description}`}
                  className="rounded-md p-1 text-slate-300 opacity-0 transition-opacity hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
