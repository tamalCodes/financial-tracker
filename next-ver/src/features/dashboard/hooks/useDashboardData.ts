"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Credit,
  Expense,
  Investment,
  MonthlyBalance,
} from "@/features/dashboard/types/types";

interface DashboardData {
  balance: MonthlyBalance | null;
  credits: Credit[];
  expenses: Expense[];
  investments: Investment[];
}

export const useDashboardData = (currentMonth: string) => {
  const [balance, setBalance] = useState<MonthlyBalance | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const shouldBootstrap = !hasLoadedOnce;
    if (shouldBootstrap) {
      setIsBootstrapping(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const res = await fetch(`/api/dashboard?month=${currentMonth}`);
      if (!res.ok) {
        throw new Error("Failed to load dashboard data");
      }
      const payload = (await res.json()) as DashboardData;
      if (isMountedRef.current) {
        setBalance(payload.balance ?? null);
        setCredits(payload.credits ?? []);
        setExpenses(payload.expenses ?? []);
        setInvestments(payload.investments ?? []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (isMountedRef.current) {
        if (shouldBootstrap) {
          setIsBootstrapping(false);
          setHasLoadedOnce(true);
        }
        setIsRefreshing(false);
      }
    }
  }, [currentMonth, hasLoadedOnce]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    balance,
    credits,
    expenses,
    investments,
    isBootstrapping,
    isRefreshing,
    reload: load,
    setBalance,
    upsertCredit: (credit: Credit) => {
      setCredits((prev) => {
        const index = prev.findIndex((item) => item.id === credit.id);
        if (index === -1) {
          return [credit, ...prev];
        }
        const next = [...prev];
        next[index] = credit;
        return next;
      });
    },
    removeCredit: (id: string) => {
      setCredits((prev) => prev.filter((item) => item.id !== id));
    },
    upsertExpense: (expense: Expense) => {
      setExpenses((prev) => {
        const index = prev.findIndex((item) => item.id === expense.id);
        if (index === -1) {
          return [expense, ...prev];
        }
        const next = [...prev];
        next[index] = expense;
        return next;
      });
    },
    removeExpense: (id: string) => {
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    },
    upsertInvestment: (investment: Investment) => {
      setInvestments((prev) => {
        const index = prev.findIndex((item) => item.id === investment.id);
        if (index === -1) {
          return [investment, ...prev];
        }
        const next = [...prev];
        next[index] = investment;
        return next;
      });
    },
    removeInvestment: (id: string) => {
      setInvestments((prev) => prev.filter((item) => item.id !== id));
    },
  };
};
