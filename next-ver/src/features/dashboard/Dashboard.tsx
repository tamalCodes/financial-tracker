"use client";

import { useState } from "react";
import MonthHeader from "@/features/dashboard/components/MonthHeader";
import BalancePanel from "@/features/dashboard/components/BalancePanel";
import TransactionSection from "@/features/dashboard/components/TransactionSection";
import TransactionList from "@/features/dashboard/components/TransactionList";
import CreditForm from "@/features/dashboard/components/CreditForm";
import ExpenseForm from "@/features/dashboard/components/ExpenseForm";
import InvestmentForm from "@/features/dashboard/components/InvestmentForm";
import { formatCurrency } from "@/features/dashboard/utils/format";
import { formatExpenseDate } from "@/features/dashboard/utils/dates";
import { TrendingDown, TrendingUp } from "lucide-react";
import StartingBalanceModal from "@/features/dashboard/components/StartingBalanceModal";
import { useDashboardState } from "@/features/dashboard/hooks/useDashboardState";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useLockBodyScroll } from "@/features/shared/hooks/useLockBodyScroll";
import { evaluateExpression } from "@/features/dashboard/utils/expression";

export default function Dashboard() {
  const {
    currentMonth,
    monthLabel,
    canNavigateNextMonth,
    isViewingCurrentMonth,
    canEditCurrentMonth,
    startingBalanceInput,
    setStartingBalanceInput,
    showStartingBalanceForm,
    setShowStartingBalanceForm,
    startingBalanceError,
    setStartingBalanceError,
    updatingStartingBalance,
    setUpdatingStartingBalance,
    handleChangeMonth,
  } = useDashboardState();
  const {
    balance,
    credits,
    expenses,
    investments,
    isBootstrapping,
    isRefreshing,
    reload,
    setBalance,
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
    showCreditForm ||
    showExpenseForm ||
    showInvestmentForm ||
    showStartingBalanceForm;

  useLockBodyScroll(isAnyModalOpen);
  const showEmptyMonthMessage =
    !isBootstrapping &&
    !isRefreshing &&
    !canEditCurrentMonth &&
    !balance &&
    credits.length === 0 &&
    expenses.length === 0 &&
    investments.length === 0;

  const handleOpenStartingBalanceForm = () => {
    if (!balance || !canEditCurrentMonth) return;
    setStartingBalanceInput(balance.starting_balance.toString());
    setStartingBalanceError("");
    setShowStartingBalanceForm(true);
  };

  const handleCloseStartingBalanceForm = () => {
    setStartingBalanceError("");
    setShowStartingBalanceForm(false);
  };

  const handleSetStartingBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditCurrentMonth) return;

    const amount = evaluateExpression(startingBalanceInput);
    if (amount === null) return;

    const res = await fetch("/api/balances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentMonth, startingBalance: amount }),
    });

    if (res.ok) {
      setStartingBalanceInput("");
      setShowStartingBalanceForm(false);
      reload();
      return;
    }

    const data = await res.json();
    setStartingBalanceError(data.error ?? "Unable to save changes.");
  };

  const handleUpdateStartingBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance || !canEditCurrentMonth) return;

    setStartingBalanceError("");
    const amount = evaluateExpression(startingBalanceInput);
    if (amount === null) {
      setStartingBalanceError("Please enter a valid number.");
      return;
    }

    setUpdatingStartingBalance(true);
    const res = await fetch("/api/balances", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentMonth, startingBalance: amount }),
    });
    setUpdatingStartingBalance(false);

    if (res.ok) {
      setShowStartingBalanceForm(false);
      reload();
      return;
    }

    const data = await res.json();
    setStartingBalanceError(data.error ?? "Unable to save changes.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isBootstrapping ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((card) => (
                <div
                  key={card}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 animate-pulse"
                >
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                  <div className="h-6 bg-slate-200 rounded w-2/3" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 animate-pulse">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-4 bg-slate-100 rounded" />
              ))}
              <div className="h-12 bg-slate-200 rounded" />
            </div>
          </div>
        ) : (
          <>
            <MonthHeader
              monthLabel={monthLabel}
              isViewingCurrentMonth={isViewingCurrentMonth}
              canNavigateNextMonth={canNavigateNextMonth}
              isRefreshing={isRefreshing}
              onPrev={() => handleChangeMonth("prev")}
              onNext={() => handleChangeMonth("next")}
            />
            {showEmptyMonthMessage && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                No data captured for {monthLabel}.
              </div>
            )}
            <BalancePanel
              balance={balance}
              canEditCurrentMonth={canEditCurrentMonth}
              startingBalanceInput={startingBalanceInput}
              onStartInputChange={setStartingBalanceInput}
              onSetStartingBalance={handleSetStartingBalance}
              onEditStartingBalance={handleOpenStartingBalanceForm}
              formatCurrency={formatCurrency}
            />
            <TransactionSection
              title="Expenses"
              icon={<TrendingDown className="w-5 h-5 text-red-600" />}
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
                  const data = await res.json();
                  removeExpense(id);
                  if (data.balance) {
                    setBalance(data.balance);
                  }
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
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
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
                  const data = await res.json();
                  removeCredit(id);
                  if (data.balance) {
                    setBalance(data.balance);
                  }
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
              icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
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
                  const data = await res.json();
                  removeInvestment(id);
                  if (data.balance) {
                    setBalance(data.balance);
                  }
                }}
                formatCurrency={formatCurrency}
              />
            </TransactionSection>
          </>
        )}
      </main>
      <StartingBalanceModal
        isOpen={showStartingBalanceForm}
        monthLabel={monthLabel}
        startingBalanceInput={startingBalanceInput}
        startingBalanceError={startingBalanceError}
        updatingStartingBalance={updatingStartingBalance}
        onClose={handleCloseStartingBalanceForm}
        onInputChange={setStartingBalanceInput}
        onSubmit={handleUpdateStartingBalance}
      />
      {showCreditForm && (
        <CreditForm
          currentMonth={currentMonth}
          onClose={() => {
            setShowCreditForm(false);
            setEditingCredit(null);
          }}
          onSuccess={(payload) => {
            upsertCredit(payload.item);
            if (payload.balance) {
              setBalance(payload.balance);
            }
          }}
          credit={
            editingCredit
              ? {
                  id: editingCredit.id,
                  description: editingCredit.description,
                  amount: Number(editingCredit.amount),
                  carry_forward: false, // DEPRECATED (D13); legacy form prop, replaced in PART C
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
            if (payload.balance) {
              setBalance(payload.balance);
            }
          }}
          expense={
            editingExpense
              ? {
                  id: editingExpense.id,
                  description: editingExpense.description,
                  amount: Number(editingExpense.amount),
                  carry_forward: false, // DEPRECATED (D13); legacy form prop, replaced in PART C
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
            if (payload.balance) {
              setBalance(payload.balance);
            }
          }}
        />
      )}
    </div>
  );
}
