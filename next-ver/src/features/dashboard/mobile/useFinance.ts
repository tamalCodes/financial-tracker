"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardState } from "@/features/dashboard/hooks/useDashboardState";
import { formatTxnDate } from "@/features/dashboard/utils/dates";
import type { Bill, Credit, Expense, Investment } from "@/features/dashboard/types/types";
import {
  billIconFor,
  catOf,
  CATS,
  fmt,
  fmtCompact,
  type CategoryKey,
  type SheetMode,
} from "./data";

// Recent-payments page size. Mirrors EXPENSES_PAGE_SIZE on the server: page 1 arrives
// in the dashboard payload, pages 2+ are fetched from GET /api/expenses.
const EXPENSES_PAGE_SIZE = 6;

// One "recent payment" row as the mobile UI consumes it (display strings + raw fields
// needed to prefill the edit sheet).
export interface TxView {
  id: string;
  merchant: string;
  category: string;
  categoryKey: CategoryKey;
  tag: string | null;
  date: string;
  amount: string;
  rawAmount: number;
  rgb: string;
  text: string;
}

// Real finance state for the mobile home — backed by /api/dashboard (+ mutation routes).
// Returns the same shape the old in-memory useFinanceDemo did, so the leaf components
// (HeroBalance/Transactions/BillsEmis/AddSheet) stay untouched. Money model is computed
// server-side (cumulative Left-in-bank incl. opening balance); the client only formats.
export function useFinance() {
  const { currentMonth, monthLabel, canNavigateNextMonth, handleChangeMonth } =
    useDashboardState();
  const {
    summary,
    credits,
    expenses,
    expensesTotal,
    loggedTotal,
    bills,
    setBills,
    reload,
    upsertExpense,
    upsertCredit,
    upsertInvestment,
    isBootstrapping,
  } = useDashboardData(currentMonth);

  // ── Recent-payments pagination ───────────────────────────────────────────────
  // Page 1 reuses the dashboard payload (no extra request); pages 2+ are fetched.
  const [expPage, setExpPage] = useState(1);
  const [pageRows, setPageRows] = useState<Expense[] | null>(null);

  const expPages = Math.max(1, Math.ceil(expensesTotal / EXPENSES_PAGE_SIZE));

  // Reset to the newest page whenever the month changes.
  useEffect(() => {
    setExpPage(1);
  }, [currentMonth]);

  // Fetch pages beyond the first; page 1 is served straight from the dashboard rows.
  useEffect(() => {
    if (expPage === 1) {
      setPageRows(null);
      return;
    }
    let active = true;
    fetch(
      `/api/expenses?month=${currentMonth}&page=${expPage}&pageSize=${EXPENSES_PAGE_SIZE}`
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("page load failed"))))
      .then((d: { items: Expense[] }) => {
        if (active) setPageRows(d.items ?? []);
      })
      .catch((error) => {
        console.error(error);
        if (active) setPageRows([]);
      });
    return () => {
      active = false;
    };
  }, [expPage, currentMonth]);

  const expensesPage = useMemo(
    () => (expPage === 1 ? expenses : pageRows ?? []),
    [expPage, expenses, pageRows]
  );

  // AddSheet state
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formCat, setFormCat] = useState<CategoryKey>("food");
  const [saving, setSaving] = useState(false);

  // ── Derived money model (server-computed; we only format) ────────────────────
  // logged/count are full-month totals from the server, NOT the current page slice.
  const derived = useMemo(
    () => ({
      net: fmt(summary.leftInBank),
      earned: fmt(summary.earned),
      spent: fmt(summary.spent),
      invested: fmt(summary.invested),
      logged: fmt(loggedTotal),
      loggedCompact: fmtCompact(loggedTotal),
      count: expensesTotal,
    }),
    [summary, loggedTotal, expensesTotal]
  );

  const txView = useMemo(
    () =>
      expensesPage.map((e: Expense) => {
        const c = catOf(e.category as CategoryKey);
        return {
          id: e.id,
          merchant: e.description,
          category: c.label,
          categoryKey: e.category as CategoryKey,
          tag: e.tag ?? null,
          date: e.created_at ? formatTxnDate(e.created_at) : "",
          amount: fmt(Number(e.amount)),
          rawAmount: Number(e.amount),
          rgb: c.rgb,
          text: c.text,
        };
      }),
    [expensesPage]
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

  const incomeView = useMemo(
    () =>
      credits.map((c: Credit) => ({
        id: c.id,
        name: c.description,
        date: c.created_at ? formatTxnDate(c.created_at) : "",
        amount: fmt(Number(c.amount)),
      })),
    [credits]
  );

  const incomeTotal = useMemo(
    () => fmt(credits.reduce((s, c) => s + Number(c.amount), 0)),
    [credits]
  );

  const incomeCompact = useMemo(
    () => fmtCompact(credits.reduce((s, c) => s + Number(c.amount), 0)),
    [credits]
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
      setExpPage(1); // newest entry lives on page 1
      setSheet(null);
      setFormAmount("");
      setFormNote("");
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // ── Edit an existing expense (tap a recent payment) ──────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editCat, setEditCat] = useState<CategoryKey>("food");
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (tx: TxView) => {
    setEditId(tx.id);
    setEditAmount(String(tx.rawAmount));
    setEditTitle(tx.merchant);
    setEditTag(tx.tag ?? "");
    setEditCat(tx.categoryKey);
  };
  const closeEdit = () => setEditId(null);
  const setEditAmountSan = (v: string) => setEditAmount(v.replace(/[^0-9]/g, ""));

  const saveEdit = async () => {
    const amount = parseInt(editAmount.replace(/[^0-9]/g, ""), 10);
    if (!editId || !amount || editSaving) return;
    const description = editTitle.trim() || catOf(editCat).label;
    setEditSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          description,
          amount,
          category: editCat,
          tag: editTag.trim(),
        }),
      });
      if (!res.ok) throw new Error("edit failed");
      const { item } = (await res.json()) as { item: Expense };
      upsertExpense(item); // page 1
      setPageRows((prev) =>
        prev ? prev.map((e) => (e.id === item.id ? item : e)) : prev
      ); // page 2+
      await reload(); // totals may shift (amount changed)
      setEditId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setEditSaving(false);
    }
  };

  return {
    loading: isBootstrapping,
    month: monthLabel,
    canNavigateNextMonth,
    prevMonth,
    nextMonth,
    derived,
    txView,
    expPage,
    expPages,
    setExpPage,
    bills: billsView,
    paidTotal,
    pay,
    income: incomeView,
    incomeTotal,
    incomeCompact,
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
    // edit sheet
    editId,
    openEdit,
    closeEdit,
    editAmount,
    editTitle,
    editTag,
    editCat,
    setEditAmount: setEditAmountSan,
    setEditTitle,
    setEditTag,
    setEditCat,
    saveEdit,
    editSaving,
  };
}

export type Finance = ReturnType<typeof useFinance>;
