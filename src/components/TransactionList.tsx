import type { KeyboardEvent } from 'react';
import { Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  created_at?: string;
  carry_forward?: boolean;
}

interface TransactionListProps {
  items: Transaction[];
  type: 'expense' | 'investment' | 'credit';
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
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (!onSelect) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
      {items.map((item) => {
        const canSelect = Boolean(onSelect);
        const showDate = item.created_at && formatDate;

        return (
          <div
            key={item.id}
            role={canSelect ? 'button' : undefined}
            tabIndex={canSelect ? 0 : undefined}
            onClick={canSelect ? () => onSelect?.(item.id) : undefined}
            onKeyDown={canSelect ? (event) => handleKeyDown(event, item.id) : undefined}
            className={`p-4 flex items-center justify-between transition-colors ${
              canSelect ? 'hover:bg-slate-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/20' : ''
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-slate-900 truncate">{item.description}</p>
              {showDate && (
                <p className="text-xs text-slate-500 mt-1">{formatDate!(item.created_at!)}</p>
              )}
              <p
                className={`text-sm font-semibold mt-1 ${
                  type === 'expense'
                    ? 'text-red-600'
                    : type === 'credit'
                    ? 'text-emerald-600'
                    : 'text-indigo-600'
                }`}
              >
                {formatCurrency(Number(item.amount))}
              </p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(item.id);
              }}
              className="ml-3 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={type === 'expense' ? 'Delete expense' : 'Delete investment'}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
