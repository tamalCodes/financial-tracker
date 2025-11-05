import {
  LogOut,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import CreditForm from "./CreditForm";
import ExpenseForm from "./ExpenseForm";
import InvestmentForm from "./InvestmentForm";
import TransactionList from "./TransactionList";

interface MonthlyBalance {
  starting_balance: number;
  closing_balance: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  carry_forward?: boolean;
  carried_from_month?: string | null;
}

interface Investment {
  id: string;
  description: string;
  amount: number;
  is_active: boolean;
}

interface Credit {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  carry_forward?: boolean;
  carried_from_month?: string | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;
  });

  const [balance, setBalance] = useState<MonthlyBalance | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showStartingBalanceForm, setShowStartingBalanceForm] = useState(false);
  const [startingBalanceInput, setStartingBalanceInput] = useState("");
  const [updatingStartingBalance, setUpdatingStartingBalance] = useState(false);
  const [startingBalanceError, setStartingBalanceError] = useState("");
  const getPreviousMonth = (month: string) => {
    const date = new Date(month);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    if (!user) return;

    await ensureCarryForwardExpenses();
    await ensureCarryForwardCredits();

    const { data: balanceData, error: balanceError } = await supabase
      .from("monthly_balances")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .maybeSingle();

    if (balanceError) {
      console.error("Failed to load monthly balance", balanceError);
    }

    let resolvedBalance = balanceData;

    if (!resolvedBalance) {
      const previousMonth = getPreviousMonth(currentMonth);

      const { data: previousBalance, error: previousError } = await supabase
        .from("monthly_balances")
        .select("closing_balance")
        .eq("user_id", user.id)
        .eq("month", previousMonth)
        .maybeSingle();

      if (previousError) {
        console.error("Failed to load previous monthly balance", previousError);
      }

      if (previousBalance?.closing_balance !== undefined) {
        const { data: insertedBalance, error: insertError } = await supabase
          .from("monthly_balances")
          .insert({
            user_id: user.id,
            month: currentMonth,
            starting_balance: previousBalance.closing_balance,
            closing_balance: previousBalance.closing_balance,
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.code !== "23505") {
            console.error("Failed to auto-create monthly balance", insertError);
          } else {
            // Balance already exists (race condition), fetch it again
            const { data: existingBalance } = await supabase
              .from("monthly_balances")
              .select("*")
              .eq("user_id", user.id)
              .eq("month", currentMonth)
              .maybeSingle();
            resolvedBalance = existingBalance;
          }
        } else {
          resolvedBalance = insertedBalance;
        }
      }
    }

    setBalance(resolvedBalance ?? null);

    const { data: creditsData } = await supabase
      .from("credits")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .order("created_at", { ascending: false });

    setCredits(creditsData || []);

    const { data: expensesData } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .order("created_at", { ascending: false });

    setExpenses(expensesData || []);

    const { data: investmentsData } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", user.id)
      .lte("start_month", currentMonth)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setInvestments(investmentsData || []);

    if (resolvedBalance) {
      await updateClosingBalance(
        resolvedBalance.starting_balance,
        creditsData || [],
        expensesData || [],
        investmentsData || []
      );
    }
  };

  const updateClosingBalance = async (
    starting: number,
    creditList: Credit[],
    expenseList: Expense[],
    investmentList: Investment[],
    options: { updateStarting?: boolean } = {}
  ) => {
    if (!user) return false;

    const totalCredits = creditList.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );
    const totalExpenses = expenseList.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    const totalInvestments = investmentList.reduce(
      (sum, i) => sum + Number(i.amount),
      0
    );
    const closing = starting - totalExpenses - totalInvestments + totalCredits;

    const { error } = await supabase
      .from("monthly_balances")
      .update(
        options.updateStarting
          ? { starting_balance: starting, closing_balance: closing }
          : { closing_balance: closing }
      )
      .eq("user_id", user.id)
      .eq("month", currentMonth);

    if (error) {
      console.error("Failed to update closing balance", error);
      return false;
    }

    setBalance((prev) => {
      const nextStarting = options.updateStarting
        ? starting
        : prev?.starting_balance ?? starting;
      const nextBalance = {
        starting_balance: nextStarting,
        closing_balance: closing,
      };
      return prev ? { ...prev, ...nextBalance } : nextBalance;
    });

    return true;
  };

  const ensureCarryForwardExpenses = async () => {
    if (!user) return;

    const previousMonth = getPreviousMonth(currentMonth);
    if (!previousMonth) return;

    const { data: recurringExpenses, error: recurringError } = await supabase
      .from("expenses")
      .select("id, description, amount, carry_forward")
      .eq("user_id", user.id)
      .eq("month", previousMonth)
      .eq("carry_forward", true);

    if (recurringError) {
      console.error("Failed to fetch carry forward expenses", recurringError);
      return;
    }

    if (!recurringExpenses || recurringExpenses.length === 0) {
      return;
    }

    const { data: existingCopies, error: existingError } = await supabase
      .from("expenses")
      .select("description, amount, carried_from_month")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .eq("carried_from_month", previousMonth);

    if (existingError) {
      console.error(
        "Failed to check existing carry forward copies",
        existingError
      );
      return;
    }

    const existingKeys = new Set(
      (existingCopies || []).map(
        (item) => `${item.description}|${Number(item.amount)}`
      )
    );

    const insertPayload = recurringExpenses
      .filter(
        (item) =>
          !existingKeys.has(`${item.description}|${Number(item.amount)}`)
      )
      .map((item) => ({
        user_id: user.id,
        month: currentMonth,
        description: item.description,
        amount: item.amount,
        carry_forward: true,
        carried_from_month: previousMonth,
      }));

    if (insertPayload.length > 0) {
      const { error: insertError } = await supabase
        .from("expenses")
        .insert(insertPayload);

      if (insertError) {
        console.error("Failed to carry forward expenses", insertError);
      }
    }
  };

  const ensureCarryForwardCredits = async () => {
    if (!user) return;

    const previousMonth = getPreviousMonth(currentMonth);
    if (!previousMonth) return;

    const { data: recurringCredits, error: recurringError } = await supabase
      .from("credits")
      .select("id, description, amount, carry_forward")
      .eq("user_id", user.id)
      .eq("month", previousMonth)
      .eq("carry_forward", true);

    if (recurringError) {
      console.error("Failed to fetch carry forward credits", recurringError);
      return;
    }

    if (!recurringCredits || recurringCredits.length === 0) {
      return;
    }

    const { data: existingCopies, error: existingError } = await supabase
      .from("credits")
      .select("description, amount, carried_from_month")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .eq("carried_from_month", previousMonth);

    if (existingError) {
      console.error(
        "Failed to check existing carry forward credit copies",
        existingError
      );
      return;
    }

    const existingKeys = new Set(
      (existingCopies || []).map(
        (item) => `${item.description}|${Number(item.amount)}`
      )
    );

    const insertPayload = recurringCredits
      .filter(
        (item) =>
          !existingKeys.has(`${item.description}|${Number(item.amount)}`)
      )
      .map((item) => ({
        user_id: user.id,
        month: currentMonth,
        description: item.description,
        amount: item.amount,
        carry_forward: true,
        carried_from_month: previousMonth,
      }));

    if (insertPayload.length > 0) {
      const { error: insertError } = await supabase
        .from("credits")
        .insert(insertPayload);

      if (insertError) {
        console.error("Failed to carry forward credits", insertError);
      }
    }
  };

  const handleCreateExpense = () => {
    setEditingExpense(null);
    setShowExpenseForm(true);
  };

  const handleCreateCredit = () => {
    setEditingCredit(null);
    setShowCreditForm(true);
  };

  const handleSelectCredit = (id: string) => {
    const creditToEdit = credits.find((item) => item.id === id);
    if (!creditToEdit) return;
    setEditingCredit(creditToEdit);
    setShowCreditForm(true);
  };

  const handleCloseCreditForm = () => {
    setShowCreditForm(false);
    setEditingCredit(null);
  };

  const handleCreditFormSuccess = () => {
    setEditingCredit(null);
    loadData();
  };

  const handleSelectExpense = (id: string) => {
    const expenseToEdit = expenses.find((item) => item.id === id);
    if (!expenseToEdit) return;
    setEditingExpense(expenseToEdit);
    setShowExpenseForm(true);
  };

  const handleCloseExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const handleExpenseFormSuccess = () => {
    setEditingExpense(null);
    loadData();
  };

  const handleOpenStartingBalanceForm = () => {
    if (!balance) return;
    setStartingBalanceInput(balance.starting_balance.toString());
    setStartingBalanceError("");
    setShowStartingBalanceForm(true);
  };

  const handleCloseStartingBalanceForm = () => {
    setStartingBalanceError("");
    setShowStartingBalanceForm(false);
  };

  const handleUpdateStartingBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance) return;

    setStartingBalanceError("");
    const amount = parseFloat(startingBalanceInput);
    if (isNaN(amount)) {
      setStartingBalanceError("Please enter a valid number.");
      return;
    }

    setUpdatingStartingBalance(true);
    const success = await updateClosingBalance(
      amount,
      credits,
      expenses,
      investments,
      {
        updateStarting: true,
      }
    );
    setUpdatingStartingBalance(false);

    if (success) {
      setShowStartingBalanceForm(false);
    } else {
      setStartingBalanceError("Unable to save changes. Please try again.");
    }
  };

  const handleSetStartingBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(startingBalanceInput);
    if (isNaN(amount)) return;

    const { error } = await supabase.from("monthly_balances").insert({
      user_id: user.id,
      month: currentMonth,
      starting_balance: amount,
      closing_balance: amount,
    });

    if (!error) {
      setShowStartingBalanceForm(false);
      setStartingBalanceInput("");
      loadData();
    }
  };

  const handleDeleteCredit = async (id: string) => {
    await supabase.from("credits").delete().eq("id", id);
    loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    loadData();
  };

  const handleDeleteInvestment = async (id: string) => {
    await supabase
      .from("investments")
      .update({ is_active: false })
      .eq("id", id);
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatExpenseDate = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const day = date.getDate();
    const month = date.toLocaleDateString("en-IN", { month: "short" });
    const suffix =
      day % 10 === 1 && day % 100 !== 11
        ? "st"
        : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
        ? "rd"
        : "th";
    return `${day}${suffix} ${month}`;
  };

  const getMonthName = () => {
    const date = new Date(currentMonth);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Financial Tracker
              </h1>
              <p className="text-xs text-slate-600">{getMonthName()}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {!balance ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Set Starting Balance
            </h2>
            <form onSubmit={handleSetStartingBalance} className="space-y-4">
              <input
                type="number"
                step="0.01"
                placeholder="Enter starting balance"
                value={startingBalanceInput}
                onChange={(e) => setStartingBalanceInput(e.target.value)}
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
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleOpenStartingBalanceForm}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-slate-900/40"
                aria-label="Edit starting balance"
              >
                <p className="text-sm text-slate-600 mb-1">Starting Balance</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(balance.starting_balance)}
                </p>
              </button>
              <div className="bg-slate-900 rounded-2xl shadow-sm p-5">
                <p className="text-sm text-slate-400 mb-1">Closing Balance</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(balance.closing_balance)}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Expenses
                  </h2>
                </div>
                <button
                  onClick={handleCreateExpense}
                  className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {expenses.length > 0 ? (
                <TransactionList
                  items={expenses}
                  type="expense"
                  onDelete={handleDeleteExpense}
                  formatCurrency={formatCurrency}
                  onSelect={handleSelectExpense}
                  formatDate={formatExpenseDate}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500 text-sm">No expenses recorded</p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Credits
                  </h2>
                </div>
                <button
                  onClick={handleCreateCredit}
                  className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {credits.length > 0 ? (
                <TransactionList
                  items={credits}
                  type="credit"
                  onDelete={handleDeleteCredit}
                  formatCurrency={formatCurrency}
                  onSelect={handleSelectCredit}
                  formatDate={formatExpenseDate}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500 text-sm">No credits recorded</p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Investments
                  </h2>
                </div>
                <button
                  onClick={() => setShowInvestmentForm(true)}
                  className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {investments.length > 0 ? (
                <TransactionList
                  items={investments}
                  type="investment"
                  onDelete={handleDeleteInvestment}
                  formatCurrency={formatCurrency}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500 text-sm">
                    No investments recorded
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showStartingBalanceForm && balance && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Edit Starting Balance
                </h2>
                <p className="text-xs text-slate-500 mt-1">{getMonthName()}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseStartingBalanceForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close starting balance editor"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateStartingBalance}
              className="p-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="starting-balance"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Starting balance
                </label>
                <input
                  id="starting-balance"
                  type="number"
                  step="0.01"
                  min={0}
                  value={startingBalanceInput}
                  onChange={(e) => setStartingBalanceInput(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-base"
                />
              </div>

              {startingBalanceError && (
                <p className="text-sm text-red-600">{startingBalanceError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseStartingBalanceForm}
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
      )}

      {showCreditForm && (
        <CreditForm
          currentMonth={currentMonth}
          onClose={handleCloseCreditForm}
          onSuccess={handleCreditFormSuccess}
          credit={
            editingCredit
              ? {
                  id: editingCredit.id,
                  description: editingCredit.description,
                  amount: Number(editingCredit.amount),
                  carry_forward: editingCredit.carry_forward ?? false,
                }
              : undefined
          }
        />
      )}

      {showExpenseForm && (
        <ExpenseForm
          currentMonth={currentMonth}
          onClose={handleCloseExpenseForm}
          onSuccess={handleExpenseFormSuccess}
          expense={
            editingExpense
              ? {
                  id: editingExpense.id,
                  description: editingExpense.description,
                  amount: Number(editingExpense.amount),
                  carry_forward: editingExpense.carry_forward ?? false,
                }
              : undefined
          }
        />
      )}

      {showInvestmentForm && (
        <InvestmentForm
          currentMonth={currentMonth}
          onClose={() => setShowInvestmentForm(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
