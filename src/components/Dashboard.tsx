import {
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import { supabase } from "../lib/supabase";
import CreditForm from "./CreditForm";
import ExpenseForm from "./ExpenseForm";
import InvestmentForm from "./InvestmentForm";
import TransactionList from "./TransactionList";

const formatMonthKey = (date: Date) => {
  const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
  return `${normalized.getFullYear()}-${String(
    normalized.getMonth() + 1
  ).padStart(2, "0")}-01`;
};

const parseMonthKey = (key: string) => {
  const [yearStr, monthStr] = key.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  return new Date(year, monthIndex, 1);
};

const shiftMonthKey = (key: string, delta: number) => {
  const date = parseMonthKey(key);
  date.setMonth(date.getMonth() + delta);
  return formatMonthKey(date);
};

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
  carry_forward?: boolean | null;
  start_month: string;
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
  const [currentMonth, setCurrentMonth] = useState(() =>
    formatMonthKey(new Date())
  );

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
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const totalExpensesAmount = useMemo(
    () =>
      expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0),
    [expenses]
  );
  const isAnyModalOpen =
    showCreditForm ||
    showExpenseForm ||
    showInvestmentForm ||
    showStartingBalanceForm;
  useLockBodyScroll(isAnyModalOpen);
  const todayMonthKey = useMemo(() => formatMonthKey(new Date()), []);
  const selectedMonthDate = useMemo(
    () => parseMonthKey(currentMonth),
    [currentMonth]
  );
  const todayMonthDate = useMemo(
    () => parseMonthKey(todayMonthKey),
    [todayMonthKey]
  );
  const isViewingCurrentMonth = currentMonth === todayMonthKey;
  const canNavigateNextMonth = selectedMonthDate < todayMonthDate;
  const monthLabel = useMemo(
    () =>
      selectedMonthDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    [selectedMonthDate]
  );
  const canEditCurrentMonth = isViewingCurrentMonth;
  const showEmptyMonthMessage =
    !isBootstrapping &&
    !isRefreshing &&
    !canEditCurrentMonth &&
    !balance &&
    credits.length === 0 &&
    expenses.length === 0 &&
    investments.length === 0;
  const getPreviousMonth = (month: string) => {
    return shiftMonthKey(month, -1);
  };
  const getNextMonth = (month: string) => shiftMonthKey(month, 1);
  const handleChangeMonth = (direction: "prev" | "next") => {
    if (direction === "next" && !canNavigateNextMonth) {
      return;
    }
    const targetMonth =
      direction === "next"
        ? getNextMonth(currentMonth)
        : getPreviousMonth(currentMonth);
    const targetDate = parseMonthKey(targetMonth);
    if (targetDate > todayMonthDate) {
      setCurrentMonth(todayMonthKey);
      return;
    }
    setCurrentMonth(targetMonth);
  };

  const loadData = useCallback(async () => {
    if (!user) return;

    await Promise.all([
      ensureCarryForwardExpenses(),
      ensureCarryForwardCredits(),
    ]);

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

    const [creditsResult, expensesResult, investmentsResult] =
      await Promise.all([
        supabase
          .from("credits")
          .select("id, description, amount, created_at, carry_forward")
          .eq("user_id", user.id)
          .eq("month", currentMonth)
          .order("created_at", { ascending: false }),
        supabase
          .from("expenses")
          .select(
            "id, description, amount, created_at, carry_forward, carried_from_month"
          )
          .eq("user_id", user.id)
          .eq("month", currentMonth)
          .order("created_at", { ascending: false }),
        supabase
          .from("investments")
          .select(
            "id, description, amount, carry_forward, start_month, created_at, is_active"
          )
          .eq("user_id", user.id)
          .lte("start_month", currentMonth)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);

    if (creditsResult.error) {
      console.error("Failed to load credits", creditsResult.error);
    }
    if (expensesResult.error) {
      console.error("Failed to load expenses", expensesResult.error);
    }
    if (investmentsResult.error) {
      console.error("Failed to load investments", investmentsResult.error);
    }

    const creditsData = creditsResult.data || [];
    const expensesData = expensesResult.data || [];
    const investmentsData = investmentsResult.data || [];

    setCredits(creditsData);
    setExpenses(expensesData);

    const filteredInvestments = (investmentsData || []).filter((investment) => {
      const shouldCarryForward = investment.carry_forward ?? false;
      if (shouldCarryForward) {
        return true;
      }

      return investment.start_month === currentMonth;
    });

    setInvestments(filteredInvestments);

    if (resolvedBalance) {
      await updateClosingBalance(
        resolvedBalance.starting_balance,
        creditsData,
        expensesData,
        filteredInvestments
      );
    }
  }, [currentMonth, user]);

  useEffect(() => {
    if (!user) {
      setIsBootstrapping(false);
      return;
    }

    let isMounted = true;
    const shouldBootstrap = !hasLoadedOnce;
    if (shouldBootstrap) {
      setIsBootstrapping(true);
    } else {
      setIsRefreshing(true);
    }

    loadData().finally(() => {
      if (!isMounted) return;
      if (shouldBootstrap) {
        setIsBootstrapping(false);
        setHasLoadedOnce(true);
      }
      setIsRefreshing(false);
    });

    return () => {
      isMounted = false;
    };
  }, [currentMonth, user, loadData, hasLoadedOnce]);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      setCredits([]);
      setExpenses([]);
      setInvestments([]);
      setHasLoadedOnce(false);
      setIsRefreshing(false);
    }
  }, [user]);

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
    if (!canEditCurrentMonth) return;
    setEditingExpense(null);
    setShowExpenseForm(true);
  };

  const handleCreateCredit = () => {
    if (!canEditCurrentMonth) return;
    setEditingCredit(null);
    setShowCreditForm(true);
  };

  const handleCreateInvestment = () => {
    if (!canEditCurrentMonth) return;
    setShowInvestmentForm(true);
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
    if (!balance || !canEditCurrentMonth) return;
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
    if (!balance || !canEditCurrentMonth) return;

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
    if (!user || !canEditCurrentMonth) return;

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

  const getMonthName = () => monthLabel;

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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Viewing
                </p>
                <p className="text-3xl font-heading font-semibold text-slate-900 mt-1">
                  {monthLabel}
                </p>
                {!isViewingCurrentMonth && (
                  <p className="text-sm text-slate-500 mt-2">
                    Adding new entries is disabled for historical months.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-2xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleChangeMonth("prev")}
                    className="px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    aria-label="Go to previous month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeMonth("next")}
                    disabled={!canNavigateNextMonth}
                    className={`px-3 py-2 border-l border-slate-200 transition-colors focus:outline-none ${
                      canNavigateNextMonth
                        ? "text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-900/20"
                        : "text-slate-300 bg-slate-50 cursor-not-allowed"
                    }`}
                    aria-label="Go to next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                {isRefreshing && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-ping" />
                    Syncing data...
                  </div>
                )}
              </div>
            </div>

            {showEmptyMonthMessage && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                No data captured for {monthLabel}.
              </div>
            )}

            {!balance ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                {canEditCurrentMonth ? (
                  <>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                      Set Starting Balance
                    </h2>
                    <form
                      onSubmit={handleSetStartingBalance}
                      className="space-y-4"
                    >
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Enter starting balance"
                        value={startingBalanceInput}
                        onChange={(e) =>
                          setStartingBalanceInput(e.target.value)
                        }
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
                      Switch back to the current month to enter a starting
                      balance.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleOpenStartingBalanceForm}
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

                <div className="space-y-4 pt-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <h2 className="text-3xl font-heading font-semibold text-slate-900">
                        Expenses
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateExpense}
                      disabled={!canEditCurrentMonth}
                      className={`p-2 mr-1 rounded-lg transition-colors ${
                        canEditCurrentMonth
                          ? "bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="w-7 h-7" />
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
                      <p className="text-slate-500 text-sm">
                        No expenses recorded
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-3xl font-heading font-semibold text-slate-900">
                        Credits
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateCredit}
                      disabled={!canEditCurrentMonth}
                      className={`p-2 mr-1 rounded-lg transition-colors ${
                        canEditCurrentMonth
                          ? "bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="w-7 h-7 " />
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
                      <p className="text-slate-500 text-sm">
                        No credits recorded
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5  text-indigo-600" />
                      <h2 className="text-3xl font-heading font-semibold text-slate-900">
                        Investments
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateInvestment}
                      disabled={!canEditCurrentMonth}
                      className={`p-2 mr-1 rounded-lg transition-colors ${
                        canEditCurrentMonth
                          ? "bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="w-7 h-7" />
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
            <div className="flex items-start justify-between p-6 ">
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">
                  Edit Starting Balance
                </h2>
                <p className="text-md text-slate-500 mt-1">{getMonthName()}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseStartingBalanceForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close starting balance editor"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateStartingBalance}
              className="p-6 space-y-5"
            >
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
                  onChange={(e) => setStartingBalanceInput(e.target.value)}
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
