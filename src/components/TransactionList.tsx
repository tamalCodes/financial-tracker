import { Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useMemo } from "react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  created_at?: string;
  carry_forward?: boolean;
}

interface TransactionListProps {
  items: Transaction[];
  type: "expense" | "investment" | "credit";
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
  onSelect?: (id: string) => void;
  formatDate?: (isoDate: string) => string;
}

export default function TransactionList({
  items,
  type,
  onDelete,
  formatCurrency,
  onSelect,
  formatDate,
}: TransactionListProps) {
  const isInvestment = type === "investment";
  const expenseTotal = useMemo(
    () =>
      type === "expense"
        ? items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
        : 0,
    [items, type]
  );
  const investmentTotal = useMemo(
    () =>
      type === "investment"
        ? items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
        : 0,
    [items, type]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(id);
    }
  };

  const amountColorClass =
    type === "expense"
      ? "text-red-600"
      : type === "credit"
      ? "text-emerald-600"
      : "text-indigo-600";

  const deleteLabel =
    type === "expense"
      ? "Delete expense"
      : type === "credit"
      ? "Delete credit"
      : "Delete investment";

  return (
    <>
      <div
        className={`max-h-[500px] overflow-y-auto rounded-2xl ${
          isInvestment ? "" : "bg-white shadow-sm border border-slate-200"
        }`}
      >
        <div className={isInvestment ? "flex flex-col gap-3 p-1" : "divide-y divide-slate-100"}>
          {items.map((item) => {
            const canSelect = Boolean(onSelect);
            const showDate = Boolean(item.created_at && formatDate);
            const interactiveClasses = canSelect
              ? isInvestment
                ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                : "hover:bg-slate-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              : "";

          return (
            <div
              key={item.id}
              role={canSelect ? "button" : undefined}
              tabIndex={canSelect ? 0 : undefined}
              onClick={canSelect ? () => onSelect?.(item.id) : undefined}
              onKeyDown={
                canSelect ? (event) => handleKeyDown(event, item.id) : undefined
              }
                className={
                  isInvestment
                    ? `relative flex items-start justify-between rounded-2xl border border-indigo-100 bg-white shadow-sm p-5 transition-all hover:border-indigo-200 hover:shadow-md ${interactiveClasses}`
                    : `p-4 relative flex items-center justify-between transition-colors ${interactiveClasses}`
                }
            >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p
                      className={`${
                        isInvestment ? "text-xl" : "text-[18px]"
                      } font-heading font-medium text-slate-900 truncate`}
                    >
                      {item.description}
                    </p>
                  </div>

                <p
                    className={`${
                      isInvestment ? "text-lg" : "text-md"
                    } flex w-full font-sans items-center justify-between font-semibold mt-3 ${amountColorClass}`}
                >
                  <span>{formatCurrency(Number(item.amount))}</span>
                    {showDate && item.created_at && formatDate && (
                      <span className="text-xs text-slate-500 mt-1">
                        {formatDate(item.created_at)}
                      </span>
                    )}
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(item.id);
                }}
                className={`absolute right-[20px] top-[20px] rounded-lg transition-colors ${
                  isInvestment
                    ? "text-indigo-300 hover:text-red-600 hover:bg-red-50"
                    : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                }`}
                aria-label={deleteLabel}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          );
          })}
        </div>
      </div>
      {type === "expense" && (
        <div className="bg-white p-4 max-h-[500px] overflow-y-auto rounded-2xl  border border-slate-200 divide-y text-[20px] font-heading font-medium text-slate-900">
          Total of{" "}
          <span className="font-semibold">{formatCurrency(expenseTotal)}</span>{" "}
          this month.
        </div>
      )}

      {type === "investment" && (
        <div className="bg-white p-4 max-h-[500px] overflow-y-auto rounded-2xl  border border-slate-200 divide-y text-[20px] font-heading font-medium text-slate-900">
          Total of{" "}
          <span className="font-semibold">
            {formatCurrency(investmentTotal)}
          </span>{" "}
          this month.
        </div>
      )}
    </>
  );
}
