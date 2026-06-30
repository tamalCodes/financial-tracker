"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bill,
  Credit,
  Expense,
  Investment,
  MonthSummary,
} from "@/features/dashboard/types/types";

interface DashboardData {
  summary: MonthSummary;
  credits: Credit[];
  expenses: Expense[];
  expensesTotal: number;
  loggedTotal: number;
  investments: Investment[];
  bills: Bill[];
}

const EMPTY_SUMMARY: MonthSummary = {
  leftInBank: 0,
  earned: 0,
  spent: 0,
  invested: 0,
};

export const useDashboardData = (currentMonth: string) => {
  const [summary, setSummary] = useState<MonthSummary>(EMPTY_SUMMARY);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [loggedTotal, setLoggedTotal] = useState(0);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
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
      // TEMP diagnostic — confirms the new payload shape reaches the client (browser console).
      console.log(
        `[FT][client] payload expenses=${payload.expenses?.length} expensesTotal=${payload.expensesTotal} loggedTotal=${payload.loggedTotal}`
      );
      if (isMountedRef.current) {
        setSummary(payload.summary ?? EMPTY_SUMMARY);
        setCredits(payload.credits ?? []);
        setExpenses(payload.expenses ?? []);
        setExpensesTotal(payload.expensesTotal ?? 0);
        setLoggedTotal(payload.loggedTotal ?? 0);
        setInvestments(payload.investments ?? []);
        setBills(payload.bills ?? []);
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
    summary,
    credits,
    expenses,
    expensesTotal,
    loggedTotal,
    investments,
    bills,
    setBills,
    isBootstrapping,
    isRefreshing,
    reload: load,
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
