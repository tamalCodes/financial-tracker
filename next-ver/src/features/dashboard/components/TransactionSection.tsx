"use client";

import { Plus } from "lucide-react";

interface TransactionSectionProps {
  title: string;
  icon: React.ReactNode;
  canEdit: boolean;
  onAdd: () => void;
  isEmpty: boolean;
  emptyText: string;
  children?: React.ReactNode;
}

export default function TransactionSection({
  title,
  icon,
  canEdit,
  onAdd,
  isEmpty,
  emptyText,
  children,
}: TransactionSectionProps) {
  return (
    <div className="space-y-4 pt-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-3xl font-heading font-semibold text-slate-900">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canEdit}
          className={`p-2 mr-1 rounded-lg transition-colors ${
            canEdit
              ? "bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
          aria-label={`Add ${title}`}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm">{emptyText}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
