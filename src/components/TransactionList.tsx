import { Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
}

interface TransactionListProps {
  items: Transaction[];
  type: 'expense' | 'investment';
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

export default function TransactionList({ items, type, onDelete, formatCurrency }: TransactionListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-slate-900 truncate">{item.description}</p>
            <p className={`text-sm font-semibold mt-1 ${
              type === 'expense' ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {formatCurrency(Number(item.amount))}
            </p>
          </div>
          <button
            onClick={() => onDelete(item.id)}
            className="ml-3 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
