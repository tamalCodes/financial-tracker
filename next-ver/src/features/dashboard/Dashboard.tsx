"use client";

import { useState } from "react";
import GreetingHeader from "@/features/dashboard/components/GreetingHeader";
import HeroBalance from "@/features/dashboard/components/HeroBalance";
import TransactionSection from "@/features/dashboard/components/TransactionSection";
import TransactionList from "@/features/dashboard/components/TransactionList";
import CreditForm from "@/features/dashboard/components/CreditForm";
import ExpenseForm from "@/features/dashboard/components/ExpenseForm";
import InvestmentForm from "@/features/dashboard/components/InvestmentForm";
import { formatCurrency } from "@/features/dashboard/utils/format";
import { formatExpenseDate } from "@/features/dashboard/utils/dates";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useDashboardState } from "@/features/dashboard/hooks/useDashboardState";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useLockBodyScroll } from "@/features/shared/hooks/useLockBodyScroll";

export default function Dashboard() {
  const {
    currentMonth,
    monthLabel,
    canNavigateNextMonth,
    canEditCurrentMonth,
    handleChangeMonth,
  } = useDashboardState();
  const {
    summary,
    credits,
    expenses,
    investments,
    isBootstrapping,
    reload,
    upsertCredit,
    removeCredit,
    upsertExpense,
    removeExpense,
    upsertInvestment,
    removeInvestment,
  } = useDashboardData(currentMonth);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    typeof expenses[number] | null
  >(null);
  const [editingCredit, setEditingCredit] = useState<
    typeof credits[number] | null
  >(null);
  const isAnyModalOpen =
    showCreditForm || showExpenseForm || showInvestmentForm;

  useLockBodyScroll(isAnyModalOpen);

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
        {isBootstrapping ? (
          <div className="space-y-4">
            <div className="h-16 animate-pulse rounded-3xl bg-white/60" />
            <div className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          </div>
        ) : (
          <>
            <GreetingHeader monthLabel={monthLabel} />
            <HeroBalance
              net={summary.leftInBank}
              monthLabel={monthLabel}
              earned={summary.earned}
              spent={summary.spent}
              invested={summary.invested}
              canNext={canNavigateNextMonth}
              onPrev={() => handleChangeMonth("prev")}
              onNext={() => handleChangeMonth("next")}
            />
            <TransactionSection
              title="Expenses"
              icon={<TrendingDown className="h-5 w-5 text-red-600" />}
              canEdit={canEditCurrentMonth}
              onAdd={() => {
                setEditingExpense(null);
                setShowExpenseForm(true);
              }}
              isEmpty={expenses.length === 0}
              emptyText="No expenses recorded"
            >
              <TransactionList
                items={expenses}
                type="expense"
                onDelete={async (id) => {
                  const res = await fetch(`/api/expenses?id=${id}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) return;
                  removeExpense(id);
                  reload();
                }}
                formatCurrency={formatCurrency}
                onSelect={(id) => {
                  const expenseToEdit = expenses.find((item) => item.id === id);
                  if (!expenseToEdit) return;
                  setEditingExpense(expenseToEdit);
                  setShowExpenseForm(true);
                }}
                formatDate={formatExpenseDate}
              />
            </TransactionSection>
            <TransactionSection
              title="Credits"
              icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
              canEdit={canEditCurrentMonth}
              onAdd={() => {
                setEditingCredit(null);
                setShowCreditForm(true);
              }}
              isEmpty={credits.length === 0}
              emptyText="No credits recorded"
            >
              <TransactionList
                items={credits}
                type="credit"
                onDelete={async (id) => {
                  const res = await fetch(`/api/credits?id=${id}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) return;
                  removeCredit(id);
                  reload();
                }}
                formatCurrency={formatCurrency}
                onSelect={(id) => {
                  const creditToEdit = credits.find((item) => item.id === id);
                  if (!creditToEdit) return;
                  setEditingCredit(creditToEdit);
                  setShowCreditForm(true);
                }}
                formatDate={formatExpenseDate}
              />
            </TransactionSection>
            <TransactionSection
              title="Investments"
              icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
              canEdit={canEditCurrentMonth}
              onAdd={() => setShowInvestmentForm(true)}
              isEmpty={investments.length === 0}
              emptyText="No investments recorded"
            >
              <TransactionList
                items={investments}
                type="investment"
                onDelete={async (id) => {
                  const res = await fetch(`/api/investments?id=${id}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) return;
                  removeInvestment(id);
                  reload();
                }}
                formatCurrency={formatCurrency}
              />
            </TransactionSection>
          </>
        )}
      </main>
      {showCreditForm && (
        <CreditForm
          currentMonth={currentMonth}
          onClose={() => {
            setShowCreditForm(false);
            setEditingCredit(null);
          }}
          onSuccess={(payload) => {
            upsertCredit(payload.item);
            reload();
          }}
          credit={
            editingCredit
              ? {
                  id: editingCredit.id,
                  description: editingCredit.description,
                  amount: Number(editingCredit.amount),
                  carry_forward: false, // DEPRECATED (D13); legacy form prop, replaced in F3
                }
              : undefined
          }
        />
      )}
      {showExpenseForm && (
        <ExpenseForm
          currentMonth={currentMonth}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          onSuccess={(payload) => {
            upsertExpense(payload.item);
            reload();
          }}
          expense={
            editingExpense
              ? {
                  id: editingExpense.id,
                  description: editingExpense.description,
                  amount: Number(editingExpense.amount),
                  carry_forward: false, // DEPRECATED (D13); legacy form prop, replaced in F3
                }
              : undefined
          }
        />
      )}
      {showInvestmentForm && (
        <InvestmentForm
          currentMonth={currentMonth}
          onClose={() => setShowInvestmentForm(false)}
          onSuccess={(payload) => {
            upsertInvestment(payload.item);
            reload();
          }}
        />
      )}
    </div>
  );
}
