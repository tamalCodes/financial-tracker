import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import InvestmentForm from './InvestmentForm';
import TransactionList from './TransactionList';

interface MonthlyBalance {
  starting_balance: number;
  closing_balance: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  created_at: string;
}

interface Investment {
  id: string;
  description: string;
  amount: number;
  is_active: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const [balance, setBalance] = useState<MonthlyBalance | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showStartingBalanceForm, setShowStartingBalanceForm] = useState(false);
  const [startingBalanceInput, setStartingBalanceInput] = useState('');

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    if (!user) return;

    const { data: balanceData } = await supabase
      .from('monthly_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .maybeSingle();

    setBalance(balanceData);

    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .order('created_at', { ascending: false });

    setExpenses(expensesData || []);

    const { data: investmentsData } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .lte('start_month', currentMonth)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setInvestments(investmentsData || []);

    if (balanceData) {
      await updateClosingBalance(balanceData.starting_balance, expensesData || [], investmentsData || []);
    }
  };

  const updateClosingBalance = async (starting: number, expenseList: Expense[], investmentList: Investment[]) => {
    const totalExpenses = expenseList.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalInvestments = investmentList.reduce((sum, i) => sum + Number(i.amount), 0);
    const closing = starting - totalExpenses - totalInvestments;

    await supabase
      .from('monthly_balances')
      .update({ closing_balance: closing })
      .eq('user_id', user!.id)
      .eq('month', currentMonth);

    setBalance(prev => prev ? { ...prev, closing_balance: closing } : null);
  };

  const handleSetStartingBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(startingBalanceInput);
    if (isNaN(amount)) return;

    const { error } = await supabase
      .from('monthly_balances')
      .insert({
        user_id: user.id,
        month: currentMonth,
        starting_balance: amount,
        closing_balance: amount,
      });

    if (!error) {
      setShowStartingBalanceForm(false);
      setStartingBalanceInput('');
      loadData();
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    loadData();
  };

  const handleDeleteInvestment = async (id: string) => {
    await supabase.from('investments').update({ is_active: false }).eq('id', id);
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = () => {
    const date = new Date(currentMonth);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
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
              <h1 className="text-lg font-semibold text-slate-900">Financial Tracker</h1>
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
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Set Starting Balance</h2>
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <p className="text-sm text-slate-600 mb-1">Starting Balance</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(balance.starting_balance)}
                </p>
              </div>
              <div className="bg-slate-900 rounded-2xl shadow-sm p-5">
                <p className="text-sm text-slate-400 mb-1">Closing Balance</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(balance.closing_balance)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Expenses</h2>
                </div>
                <button
                  onClick={() => setShowExpenseForm(true)}
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
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500 text-sm">No expenses recorded</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Investments</h2>
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
                  <p className="text-slate-500 text-sm">No investments recorded</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showExpenseForm && (
        <ExpenseForm
          currentMonth={currentMonth}
          onClose={() => setShowExpenseForm(false)}
          onSuccess={loadData}
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
