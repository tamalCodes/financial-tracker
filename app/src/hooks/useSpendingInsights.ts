import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "../types/finance";

type InsightPayload = {
  categoryTotals: { category: string; total: number }[];
  merchantTotals: { merchant: string; total: number }[];
};

const buildInsights = async (key: string, data: InsightPayload) => {
  // Simulate IO (API, SQLite, etc.) so React Query makes sense for local + remote merges.
  await new Promise((resolve) => setTimeout(resolve, 120));
  return data;
};

export const useSpendingInsights = (transactions: Transaction[]) => {
  return useQuery({
    queryKey: [
      "spending-insights",
      transactions.map((tx) => `${tx.id}-${tx.amount}`),
    ],
    queryFn: () => {
      const categoryTotals = transactions.reduce<Record<string, number>>(
        (acc, tx) => {
          if (tx.type === "income") {
            return acc;
          }
          acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
          return acc;
        },
        {}
      );

      const merchantTotals = transactions.reduce<Record<string, number>>(
        (acc, tx) => {
          if (tx.type === "income") {
            return acc;
          }
          acc[tx.merchant] = (acc[tx.merchant] ?? 0) + tx.amount;
          return acc;
        },
        {}
      );

      const payload: InsightPayload = {
        categoryTotals: Object.entries(categoryTotals)
          .map(([category, total]) => ({ category, total }))
          .sort((a, b) => b.total - a.total),
        merchantTotals: Object.entries(merchantTotals)
          .map(([merchant, total]) => ({ merchant, total }))
          .sort((a, b) => b.total - a.total),
      };

      return buildInsights("spending", payload);
    },
  });
};
