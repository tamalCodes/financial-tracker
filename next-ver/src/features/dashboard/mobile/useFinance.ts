"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardState } from "@/features/dashboard/hooks/useDashboardState";
import { formatTxnDate } from "@/features/dashboard/utils/dates";
import type {
  Bill,
  Credit,
  EmiProgress,
  Expense,
  Investment,
} from "@/features/dashboard/types/types";
import {
  billIconFor,
  catOf,
  CATS,
  fmt,
  fmtCompact,
  type CategoryKey,
  type SheetMode,
} from "./data";
import { toast } from "./toast";

// Recent-payments page size. Mirrors EXPENSES_PAGE_SIZE on the server: page 1 arrives
// in the dashboard payload, pages 2+ are fetched from GET /api/expenses.
const EXPENSES_PAGE_SIZE = 6;

// One-off bills page size. Mirrors BILLS_PAGE_SIZE on the server: page 1 arrives in
// the dashboard payload, pages 2+ are fetched from GET /api/bills.
const BILLS_PAGE_SIZE = 6;

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

// Map a raw Bill row to the view shape both Bills-card pages consume. EMI installments
// show "Installment 3 of 8" in place of a due date; one-off bills show their due (if any).
function mapBill(b: Bill) {
  return {
    id: b.id,
    name: b.name,
    due:
      b.emi_seq && b.emi_months
        ? `Installment ${b.emi_seq} of ${b.emi_months}`
        : b.due_date ?? "",
    icon: billIconFor(b.name),
    amount: fmt(Number(b.amount)),
    rawAmount: Number(b.amount),
    paid: b.paid,
    isEmi: Boolean(b.emi_id),
    emiId: b.emi_id ?? null,
  };
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
    billsTotal,
    emis,
    reload,
    upsertExpense,
    removeExpense,
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
  const [formIsBill, setFormIsBill] = useState(false); // expense sheet → route to bills ledger
  const [formBillKind, setFormBillKind] = useState<"once" | "emi">("once"); // one-off bill vs EMI
  const [formEmiTotal, setFormEmiTotal] = useState(""); // EMI: total loan amount
  const [formEmiMonths, setFormEmiMonths] = useState(""); // EMI: duration in months
  const [saving, setSaving] = useState(false);

  // EMI progress (rolled up across all months) now ships in the dashboard payload,
  // so it refreshes automatically whenever reload() runs — no separate request.

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

  const billsView = useMemo(() => bills.map(mapBill), [bills]);

  // ── One-off bills pagination ────────────────────────────────────────────────
  // Mirrors Recent payments: page 1 is the dashboard payload (filtered to one-off
  // bills); pages 2+ are fetched from GET /api/bills. billsTotal counts one-off bills.
  const [billPage, setBillPage] = useState(1);
  const [billPageRows, setBillPageRows] = useState<Bill[] | null>(null);

  const billPages = Math.max(1, Math.ceil(billsTotal / BILLS_PAGE_SIZE));

  useEffect(() => {
    setBillPage(1);
  }, [currentMonth]);

  useEffect(() => {
    if (billPage === 1) {
      setBillPageRows(null);
      return;
    }
    let active = true;
    fetch(
      `/api/bills?month=${currentMonth}&page=${billPage}&pageSize=${BILLS_PAGE_SIZE}`
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("page load failed"))))
      .then((d: { items: Bill[] }) => {
        if (active) setBillPageRows(d.items ?? []);
      })
      .catch((error) => {
        console.error(error);
        if (active) setBillPageRows([]);
      });
    return () => {
      active = false;
    };
  }, [billPage, currentMonth]);

  // ── Bills / EMIs split (two separate cards) ─────────────────────────────────
  // One-off bills render on their own; EMI installments roll up under the EMIs card.
  const oneOffBills = useMemo(() => {
    if (billPage === 1) return billsView.filter((b) => !b.isEmi);
    return (billPageRows ?? []).map(mapBill);
  }, [billPage, billsView, billPageRows]);

  // EMIs card — one entry per EMI: its roll-up plus this month's installment row
  // (for the Pay button). thisMonth is null once the EMI has run its course.
  const emiCards = useMemo(
    () =>
      emis.map((e) => ({
        emi: e,
        thisMonth: billsView.find((b) => b.emiId === e.emi_id) ?? null,
      })),
    [emis, billsView]
  );

  // EMIs card header — Σ paid / Σ total loan (compact) across every EMI.
  const emisSummary = useMemo(() => {
    let paid = 0;
    let total = 0;
    for (const e of emis) {
      paid += e.paidAmount;
      total += e.total;
    }
    return { paid: fmtCompact(paid), total: fmtCompact(total) };
  }, [emis]);

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
      toast.success("Bill marked as paid");
    } catch (error) {
      console.error(error);
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paid: false } : b)));
      toast.error("Couldn't mark bill as paid");
    }
  };

  // opts pre-scopes the sheet for the contextual "+" buttons (desktop cards): the Bills
  // card opens straight to a one-off bill, the EMIs card to an EMI. Mode is always
  // "expense" for those two (bills/EMIs live under the expense sheet's toggle).
  const openSheet = (
    mode: SheetMode,
    opts?: { isBill?: boolean; billKind?: "once" | "emi" }
  ) => {
    setSheet(mode);
    setFormAmount("");
    setFormNote("");
    setFormCat("food");
    setFormIsBill(opts?.isBill ?? false);
    setFormBillKind(opts?.billKind ?? "once");
    setFormEmiTotal("");
    setFormEmiMonths("");
  };
  const closeSheet = () => setSheet(null);
  const setAmount = (v: string) => setFormAmount(v.replace(/[^0-9]/g, ""));

  const saveEntry = async () => {
    const amount = parseInt(formAmount.replace(/[^0-9]/g, ""), 10);
    if (!amount || saving || !sheet) return;
    const note = formNote.trim();
    setSaving(true);
    try {
      if (sheet === "expense" && formIsBill && formBillKind === "emi") {
        // EMI → expands into one installment row per month for its whole duration.
        const months = parseInt(formEmiMonths.replace(/[^0-9]/g, ""), 10);
        const total = parseInt(formEmiTotal.replace(/[^0-9]/g, ""), 10);
        if (!months) {
          toast.error("Enter the EMI duration in months");
          return;
        }
        const res = await fetch("/api/emis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentMonth,
            name: note || "EMI",
            monthly: amount,
            total: total || amount * months,
            months,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        setSheet(null);
        setFormAmount("");
        setFormNote("");
        setFormEmiTotal("");
        setFormEmiMonths("");
        setFormBillKind("once");
        setFormIsBill(false);
        reload().catch((e) => console.error(e));
        toast.success("EMI added");
        return;
      }
      if (sheet === "expense" && formIsBill) {
        // One-off Bill → separate ledger, not a plain expense.
        const res = await fetch("/api/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentMonth,
            name: note || "Bill",
            amount,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        // Close instantly; refresh the bills list in the background.
        setBillPage(1); // newest bill lives on page 1
        setSheet(null);
        setFormAmount("");
        setFormNote("");
        setFormIsBill(false);
        reload().catch((e) => console.error(e));
        toast.success("Bill added");
        return;
      }
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
        toast.success("Expense added");
      } else if (sheet === "income") {
        const res = await fetch("/api/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentMonth, description: note || "Income", amount }),
        });
        if (!res.ok) throw new Error("save failed");
        const { item } = (await res.json()) as { item: Credit };
        upsertCredit(item);
        toast.success("Income added");
      } else if (sheet === "investment") {
        const res = await fetch("/api/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentMonth, description: note || "Investment", amount }),
        });
        if (!res.ok) throw new Error("save failed");
        const { item } = (await res.json()) as { item: Investment };
        upsertInvestment(item);
        toast.success("Investment added");
      }
      // Row is already shown optimistically — close instantly, reconcile totals after.
      setExpPage(1); // newest entry lives on page 1
      setSheet(null);
      setFormAmount("");
      setFormNote("");
      reload().catch((e) => console.error(e));
    } catch (error) {
      console.error(error);
      toast.error("Couldn't save — try again");
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
  const [editDeleting, setEditDeleting] = useState(false);

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
      toast.success("Payment updated");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't update payment");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteEdit = async () => {
    if (!editId || editDeleting) return;
    const id = editId;
    setEditDeleting(true);
    // Close instantly + drop the row optimistically; reconcile with the server after.
    setEditId(null);
    removeExpense(id); // page 1
    setPageRows((prev) => (prev ? prev.filter((e) => e.id !== id) : prev)); // page 2+
    try {
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      await reload(); // totals + count shift
      toast.success("Payment deleted");
    } catch (error) {
      console.error(error);
      await reload(); // restore the row if the delete failed
      toast.error("Couldn't delete payment");
    } finally {
      setEditDeleting(false);
    }
  };

  // ── Edit a bill or an EMI (tap a row / strip) ────────────────────────────────
  // One sheet, two kinds. `id` is the bill id (kind "bill") or the emi_id (kind "emi").
  // For EMIs, `amount` is the per-installment (monthly) value; `total` is the loan total.
  const [billEdit, setBillEdit] = useState<null | {
    kind: "bill" | "emi";
    id: string;
    name: string;
    amount: string;
    total: string;
    months: number | null;
  }>(null);
  const [billEditSaving, setBillEditSaving] = useState(false);
  const [billEditDeleting, setBillEditDeleting] = useState(false);

  const openBillEdit = (b: { id: string; name: string; rawAmount: number }) =>
    setBillEdit({ kind: "bill", id: b.id, name: b.name, amount: String(b.rawAmount), total: "", months: null });

  const openEmiEdit = (e: EmiProgress) =>
    setBillEdit({ kind: "emi", id: e.emi_id, name: e.name, amount: String(e.monthly), total: String(e.total), months: e.months });

  const closeBillEdit = () => setBillEdit(null);
  const setBillEditName = (v: string) => setBillEdit((p) => (p ? { ...p, name: v } : p));
  const setBillEditAmount = (v: string) =>
    setBillEdit((p) => (p ? { ...p, amount: v.replace(/[^0-9]/g, "") } : p));
  const setBillEditTotal = (v: string) =>
    setBillEdit((p) => (p ? { ...p, total: v.replace(/[^0-9]/g, "") } : p));

  const saveBillEdit = async () => {
    if (!billEdit || billEditSaving) return;
    const name = billEdit.name.trim();
    const amount = parseInt(billEdit.amount.replace(/[^0-9]/g, ""), 10);
    if (!name || !amount) return;
    setBillEditSaving(true);
    try {
      if (billEdit.kind === "emi") {
        const total =
          parseInt(billEdit.total.replace(/[^0-9]/g, ""), 10) ||
          amount * (billEdit.months ?? 1);
        const res = await fetch("/api/emis", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emi_id: billEdit.id, name, monthly: amount, total }),
        });
        if (!res.ok) throw new Error("edit failed");
      } else {
        const res = await fetch("/api/bills", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: billEdit.id, name, amount }),
        });
        if (!res.ok) throw new Error("edit failed");
      }
      await reload();
      setBillEdit(null);
      toast.success(billEdit.kind === "emi" ? "EMI updated" : "Bill updated");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't update — try again");
    } finally {
      setBillEditSaving(false);
    }
  };

  const deleteBillEdit = async () => {
    if (!billEdit || billEditDeleting) return;
    const { kind, id } = billEdit;
    setBillEditDeleting(true);
    try {
      const url =
        kind === "emi"
          ? `/api/emis?emi_id=${encodeURIComponent(id)}`
          : `/api/bills?id=${encodeURIComponent(id)}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      await reload();
      setBillEdit(null);
      toast.success(kind === "emi" ? "EMI deleted" : "Bill deleted");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't delete — try again");
    } finally {
      setBillEditDeleting(false);
    }
  };

  return {
    loading: isBootstrapping,
    month: monthLabel,
    currentMonth, // 'YYYY-MM-01' key — used by the desktop trend chart (useTrendData)
    canNavigateNextMonth,
    prevMonth,
    nextMonth,
    derived,
    txView,
    expPage,
    expPages,
    setExpPage,
    bills: oneOffBills,
    billPage,
    billPages,
    setBillPage,
    emiCards,
    emisSummary,
    emis,
    pay,
    // bill / EMI edit sheet
    billEdit,
    openBillEdit,
    openEmiEdit,
    closeBillEdit,
    setBillEditName,
    setBillEditAmount,
    setBillEditTotal,
    saveBillEdit,
    deleteBillEdit,
    billEditSaving,
    billEditDeleting,
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
    formIsBill,
    setFormIsBill,
    formBillKind,
    setFormBillKind,
    formEmiTotal,
    setFormEmiTotal,
    formEmiMonths,
    setFormEmiMonths,
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
    deleteEdit,
    editDeleting,
  };
}

export type Finance = ReturnType<typeof useFinance>;
