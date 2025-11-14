import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Account, Transaction } from "../types/finance";

type FinancialData = {
  accounts: Account[];
  transactions: Transaction[];
};

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: "operating",
    name: "Operating",
    balance: 8425.37,
    color: "#0D9488",
    institution: "Chase",
  },
  {
    id: "savings",
    name: "Savings",
    balance: 12050.0,
    color: "#7C3AED",
    institution: "CapitalOne",
  },
];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: generateId(),
    accountId: "operating",
    amount: 32.67,
    category: "Transport",
    merchant: "Uber",
    type: "expense",
    createdAt: new Date().toISOString(),
    notes: "Airport drop",
  },
  {
    id: generateId(),
    accountId: "operating",
    amount: 2200,
    category: "Salary",
    merchant: "Acme Inc.",
    type: "income",
    createdAt: new Date().toISOString(),
  },
];

const fetchFinancialData = async (): Promise<FinancialData> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    accounts: SAMPLE_ACCOUNTS,
    transactions: SAMPLE_TRANSACTIONS,
  };
};

export const useFinancialData = () =>
  useQuery({
    queryKey: ["financial-data"],
    queryFn: fetchFinancialData,
    staleTime: Infinity,
  });

export const useTotals = (transactions: Transaction[]) =>
  useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      income,
      expenses,
      net: income - expenses,
    };
  }, [transactions]);

export const useRecentTransactions = (transactions: Transaction[], limit = 5) =>
  useMemo(() => transactions.slice(0, limit), [transactions, limit]);
