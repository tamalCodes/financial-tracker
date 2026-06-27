"use client";

import { useMemo, useState } from "react";
import {
  AUTO_INVEST,
  BILL_DEFS,
  catOf,
  CATS,
  DEFAULT_MONTH_IDX,
  fmt,
  MONTHS,
  SALARY,
  SEED_TXS,
  SPENT_BASE,
  type CategoryKey,
  type SheetMode,
  type Tx,
} from "./data";

// In-memory finance state + derived money model (README §7). Optimistic, no network.
export function useFinanceDemo() {
  const [monthIdx, setMonthIdx] = useState(DEFAULT_MONTH_IDX);
  const [txs, setTxs] = useState<Tx[]>(SEED_TXS);
  const [paid, setPaid] = useState<Record<string, boolean>>({});
  const [extraIncome, setExtraIncome] = useState(0);
  const [extraInvest, setExtraInvest] = useState(0);

  // AddSheet state
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formCat, setFormCat] = useState<CategoryKey>("food");

  // ── Derived money model ────────────────────────────────────────────────────
  const derived = useMemo(() => {
    const loggedSum = txs.reduce((s, t) => s + t.amount, 0);
    const earned = SALARY + extraIncome;
    const invested = AUTO_INVEST + extraInvest;
    const spent = SPENT_BASE + loggedSum;
    const net = earned - spent - invested;
    return {
      net: fmt(net),
      earned: fmt(earned),
      spent: fmt(spent),
      invested: fmt(invested),
      logged: fmt(loggedSum),
      count: txs.length,
    };
  }, [txs, extraIncome, extraInvest]);

  // Bills view + Paid-this-month total (recomputes on pay)
  const bills = useMemo(
    () =>
      BILL_DEFS.map((b) => {
        const isPaid = paid[b.id] ?? !!b.paidDefault;
        return {
          id: b.id,
          name: b.name,
          due: b.due,
          icon: b.icon,
          amount: fmt(b.amount),
          paid: isPaid,
        };
      }),
    [paid],
  );

  const paidTotal = useMemo(
    () =>
      fmt(
        BILL_DEFS.reduce(
          (s, b) => ((paid[b.id] ?? !!b.paidDefault) ? s + b.amount : s),
          0,
        ),
      ),
    [paid],
  );

  // Transactions view (category resolved to label/colours)
  const txView = useMemo(
    () =>
      txs.map((t) => {
        const c = catOf(t.cat);
        return {
          merchant: t.merchant,
          category: c.label,
          date: t.date,
          amount: fmt(t.amount),
          rgb: c.rgb,
          text: c.text,
        };
      }),
    [txs],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const prevMonth = () => setMonthIdx((i) => Math.max(0, i - 1));
  const nextMonth = () => setMonthIdx((i) => Math.min(MONTHS.length - 1, i + 1));
  const pay = (id: string) => setPaid((p) => ({ ...p, [id]: true }));

  const openSheet = (mode: SheetMode) => {
    setSheet(mode);
    setFormAmount("");
    setFormNote("");
    setFormCat("food");
  };
  const closeSheet = () => setSheet(null);
  const setAmount = (v: string) => setFormAmount(v.replace(/[^0-9]/g, ""));

  const saveEntry = () => {
    const amt = parseInt(formAmount.replace(/[^0-9]/g, ""), 10);
    if (!amt) return;
    const note = formNote.trim();
    if (sheet === "expense") {
      const c = catOf(formCat);
      const tx: Tx = { merchant: note || c.label, cat: c.key, amount: amt, date: "Today" };
      setTxs((prev) => [tx, ...prev]);
    } else if (sheet === "income") {
      setExtraIncome((v) => v + amt);
    } else if (sheet === "investment") {
      setExtraInvest((v) => v + amt);
    }
    setSheet(null);
    setFormAmount("");
    setFormNote("");
  };

  return {
    month: MONTHS[monthIdx],
    prevMonth,
    nextMonth,
    derived,
    txView,
    bills,
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
    cats: CATS,
  };
}

export type FinanceDemo = ReturnType<typeof useFinanceDemo>;
