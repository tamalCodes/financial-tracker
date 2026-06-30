"use client";

import { useMemo, useState } from "react";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardState } from "@/features/dashboard/hooks/useDashboardState";
import { formatTxnDate } from "@/features/dashboard/utils/dates";
import type { Bill, Credit, Expense, Investment } from "@/features/dashboard/types/types";
import {
  billIconFor,
  catOf,
  CATS,
  fmt,
  type CategoryKey,
  type SheetMode,
} from "./data";

// Real finance state for the mobile home — backed by /api/dashboard (+ mutation routes).
// Returns the same shape the old in-memory useFinanceDemo did, so the leaf components
// (HeroBalance/Transactions/BillsEmis/AddSheet) stay untouched. Money model is computed
// server-side (cumulative Left-in-bank incl. opening balance); the client only formats.
export function useFinance() {
  const { currentMonth, monthLabel, canNavigateNextMonth, handleChangeMonth } =
    useDashboardState();
  const {
    summary,
    expenses,
    bills,
    setBills,
    reload,
    upsertExpense,
    upsertCredit,
    upsertInvestment,
  } = useDashboardData(currentMonth);

  // AddSheet state
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formCat, setFormCat] = useState<CategoryKey>("food");
  const [saving, setSaving] = useState(false);

  // ── Derived money model (server-computed; we only format) ────────────────────
  const derived = useMemo(() => {
    const loggedSum = expenses.reduce((s, e) => s + Number(e.amount), 0);
    return {
      net: fmt(summary.leftInBank),
      earned: fmt(summary.earned),
      spent: fmt(summary.spent),
      invested: fmt(summary.invested),
      logged: fmt(loggedSum),
      count: expenses.length,
    };
  }, [summary, expenses]);

  const txView = useMemo(
    () =>
      expenses.map((e: Expense) => {
        const c = catOf(e.category as CategoryKey);
        return {
          merchant: e.description,
          category: c.label,
          date: e.created_at ? formatTxnDate(e.created_at) : "",
          amount: fmt(Number(e.amount)),
          rgb: c.rgb,
          text: c.text,
        };
      }),
    [expenses]
  );

  const billsView = useMemo(
    () =>
      bills.map((b: Bill) => ({
        id: b.id,
        name: b.name,
        due: b.due_date ?? "",
        icon: billIconFor(b.name),
        amount: fmt(Number(b.amount)),
        paid: b.paid,
      })),
    [bills]
  );

  const paidTotal = useMemo(
    () =>
      fmt(bills.reduce((s, b) => (b.paid ? s + Number(b.amount) : s), 0)),
    [bills]
  );

  // ── Mutations ────────────────────────────────────────────────────────────────
  const prevMonth = () => handleChangeMonth("prev");
  const nextMonth = () => handleChangeMonth("next");

  const pay = async (id: string) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paid: true } : b)));
    try {
      const res = await fetch("/api/bills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paid: true }),
      });
      if (!res.ok) throw new Error("pay failed");
      await reload();
    } catch (error) {
      console.error(error);
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paid: false } : b)));
    }
  };

  const openSheet = (mode: SheetMode) => {
    setSheet(mode);
    setFormAmount("");
    setFormNote("");
    setFormCat("food");
  };
  const closeSheet = () => setSheet(null);
  const setAmount = (v: string) => setFormAmount(v.replace(/[^0-9]/g, ""));

  const saveEntry = async () => {
    const amount = parseInt(formAmount.replace(/[^0-9]/g, ""), 10);
    if (!amount || saving || !sheet) return;
    const note = formNote.trim();
    setSaving(true);
    try {
      if (sheet === "expense") {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentMonth,
            description: note || catOf(formCat).label,
            amount,
            category: formCat,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        const { item } = (await res.json()) as { item: Expense };
        upsertExpense(item);
      } else if (sheet === "income") {
        const res = await fetch("/api/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentMonth, description: note || "Income", amount }),
        });
        if (!res.ok) throw new Error("save failed");
        const { item } = (await res.json()) as { item: Credit };
        upsertCredit(item);
      } else if (sheet === "investment") {
        const res = await fetch("/api/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentMonth, description: note || "Investment", amount }),
        });
        if (!res.ok) throw new Error("save failed");
        const { item } = (await res.json()) as { item: Investment };
        upsertInvestment(item);
      }
      await reload();
      setSheet(null);
      setFormAmount("");
      setFormNote("");
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return {
    month: monthLabel,
    canNavigateNextMonth,
    prevMonth,
    nextMonth,
    derived,
    txView,
    bills: billsView,
    paidTotal,
    pay,
    // sheet
    sheet,
    openSheet,
    closeSheet,
    formAmount,
    formNote,
    formCat,
    setAmount,
    setNote: setFormNote,
    setCat: setFormCat,
    saveEntry,
    saving,
    cats: CATS,
  };
}

export type Finance = ReturnType<typeof useFinance>;
