"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import AmountField, {
  OperatorBar,
  type AmountFieldHandle,
} from "./AmountField";
import CatPill from "./CatPill";
import {
  BODY,
  DISPLAY,
  NOTE_LABEL,
  NOTE_PLACEHOLDER,
  SHEET_TITLE,
  type Category,
  type CategoryKey,
  type SheetMode,
} from "./data";

// AddSheet — pixel from AddSheet.dc.html (handoff §5.6 + mode matrix §6).
// One sheet, three modes. Category picker shows for expense only.
interface Props {
  mode: SheetMode;
  amount: string;
  note: string;
  cat: CategoryKey;
  cats: Category[];
  isBill: boolean; // expense mode only: route this entry to the bills / EMI ledger
  billKind: "once" | "emi"; // bill sub-mode: one-off bill vs multi-month EMI
  emiTotal: string; // EMI: total loan amount
  emiMonths: string; // EMI: duration in months
  onAmount: (v: string) => void;
  onNote: (v: string) => void;
  onCat: (key: CategoryKey) => void;
  onToggleBill: (v: boolean) => void;
  onBillKind: (v: "once" | "emi") => void;
  onEmiTotal: (v: string) => void;
  onEmiMonths: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function AddSheet({
  mode,
  amount,
  note,
  cat,
  cats,
  isBill,
  billKind,
  emiTotal,
  emiMonths,
  onAmount,
  onNote,
  onCat,
  onToggleBill,
  onBillKind,
  onEmiTotal,
  onEmiMonths,
  onSave,
  onClose,
}: Props) {
  const [noteFocus, setNoteFocus] = useState(false);
  // Amount calculator lives in AmountField; it reports when it's animating so we
  // can gate the Save button.
  const [calcActive, setCalcActive] = useState(false);
  // While the Amount field is focused on a touch device, the CTA slot becomes the
  // glassy + − × ÷ operator bar (numeric keypads omit those keys). Ref lets that
  // bar splice operators into the field; focus swaps the slot back to Save.
  const amountRef = useRef<AmountFieldHandle>(null);
  const [amountFocus, setAmountFocus] = useState(false);
  const [touch] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)").matches ?? false)
  );
  const showOps = touch && amountFocus;

  // Desktop (≥1024px): render as a centered dialog card — full radius, no
  // bottom-sheet grabber. Below that, keep the mobile bottom sheet.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const isExpense = mode === "expense";
  const asBill = isExpense && isBill;
  const asEmi = asBill && billKind === "emi";

  // EMI: once both Total and Months are filled, auto-compute the monthly
  // (total ÷ months) and drop it into the Amount field with the AI reveal
  // effect. Debounced so it waits for the user to finish typing months.
  // Keyed on Total/Months ONLY (not `amount`): the auto-fill is a suggestion —
  // once it lands, editing the monthly amount by hand must stick, so a manual
  // edit (which changes `amount`) must never re-trigger this and revert it.
  const lastAutoKey = useRef<string>("");
  useEffect(() => {
    if (!asEmi) return;
    const total = parseInt(emiTotal, 10);
    const months = parseInt(emiMonths, 10);
    if (!Number.isFinite(total) || !Number.isFinite(months) || months <= 0)
      return;
    const monthly = Math.round(total / months);
    if (monthly <= 0) return;
    const key = `${total}/${months}`;
    if (key === lastAutoKey.current) return; // this Total/Months combo already auto-filled
    lastAutoKey.current = key;
    const t = setTimeout(() => amountRef.current?.revealValue(monthly), 650);
    return () => clearTimeout(t);
  }, [asEmi, emiTotal, emiMonths]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(20,16,10,0.62)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: isDesktop ? "center" : "flex-end",
        justifyContent: "center",
        padding: isDesktop ? 24 : 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "100%",
          maxHeight: isDesktop ? "calc(100vh - 48px)" : undefined,
          overflowY: isDesktop ? "auto" : undefined,
          background: "var(--c-surface)",
          border: "1px solid var(--c-line-strong)",
          borderRadius: isDesktop ? 24 : "30px 30px 0 0",
          boxShadow: isDesktop
            ? "0 24px 80px -12px rgba(0,0,0,0.65)"
            : "0 -18px 70px -12px rgba(0,0,0,0.65)",
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            padding: "10px 22px calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          {/* Grabber (mobile bottom-sheet affordance only) */}
          <div
            style={{
              display: isDesktop ? "none" : "flex",
              justifyContent: "center",
              padding: "4px 0 16px",
            }}
          >
            <span
              style={{
                width: 42,
                height: 5,
                borderRadius: 999,
                background: "var(--c-line)",
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 21,
                letterSpacing: "-0.01em",
                color: "var(--c-ink)",
              }}
            >
              {asEmi ? "Add EMI" : asBill ? "Add Bill" : SHEET_TITLE[mode]}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                cursor: "pointer",
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "1px solid var(--c-line)",
                background: "var(--c-faint)",
                color: "var(--c-body-2)",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Type toggle (expense only): one flat choice — Expense / Bill / EMI */}
          {isExpense && (
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                marginBottom: 18,
                background: "var(--c-field)",
                borderRadius: 14,
              }}
            >
              {[
                {
                  label: "Expense",
                  on: !isBill,
                  click: () => onToggleBill(false),
                },
                {
                  label: "Bill",
                  on: isBill && billKind === "once",
                  click: () => {
                    onToggleBill(true);
                    onBillKind("once");
                  },
                },
                {
                  label: "EMI",
                  on: isBill && billKind === "emi",
                  click: () => {
                    onToggleBill(true);
                    onBillKind("emi");
                  },
                },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={t.click}
                  style={{
                    cursor: "pointer",
                    flex: 1,
                    height: 40,
                    borderRadius: 10,
                    border: "none",
                    fontFamily: DISPLAY,
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: t.on ? "var(--c-accent-2)" : "var(--c-body-2)",
                    background: t.on ? "var(--c-surface)" : "transparent",
                    boxShadow: t.on ? "0 1px 3px rgba(32,27,19,0.10)" : "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* EMI details: total loan + duration — sits above the monthly amount */}
          {asEmi && (
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <style>{`.emi-num::placeholder{font-size:15px;font-weight:500;letter-spacing:0;color:var(--c-line-strong);}`}</style>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                }}
              >
                <span
                  style={{ font: `500 13px ${BODY}`, color: "var(--c-body)" }}
                >
                  Total amount
                </span>
                <input
                  value={emiTotal}
                  onChange={(e) =>
                    onEmiTotal(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  inputMode="numeric"
                  className="emi-num"
                  placeholder="e.g. 32600"
                  autoFocus={true}
                  style={{
                    width: "100%",
                    border: "1px solid var(--c-line)",
                    borderRadius: 14,
                    padding: "0 15px",
                    height: 62,
                    fontFamily: DISPLAY,
                    fontWeight: 600,
                    fontSize: 28,
                    letterSpacing: "-0.01em",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--c-ink)",
                    background: "var(--c-faint)",
                    outline: "none",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  width: 120,
                }}
              >
                <span
                  style={{ font: `500 13px ${BODY}`, color: "var(--c-body)" }}
                >
                  Months
                </span>
                <input
                  value={emiMonths}
                  onChange={(e) =>
                    onEmiMonths(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  inputMode="numeric"
                  className="emi-num"
                  maxLength={3}
                  placeholder="e.g. 8"
                  style={{
                    width: "100%",
                    border: "1px solid var(--c-line)",
                    borderRadius: 14,
                    padding: "0 15px",
                    height: 62,
                    fontFamily: DISPLAY,
                    fontWeight: 600,
                    fontSize: 28,
                    letterSpacing: "-0.01em",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--c-ink)",
                    background: "var(--c-faint)",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}

          {/* Amount */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <span style={{ font: `500 13px ${BODY}`, color: "var(--c-body)" }}>
              {asEmi ? "Monthly amount" : "Amount"}
            </span>
            <AmountField
              ref={amountRef}
              amount={amount}
              onAmount={onAmount}
              autoFocus={!asEmi}
              onCalcActiveChange={setCalcActive}
              onFocusChange={setAmountFocus}
            />
          </div>

          {/* Category picker (plain expense only — bills have no category) */}
          {isExpense && !isBill && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
                marginBottom: 18,
              }}
            >
              <span
                style={{ font: `500 13px ${BODY}`, color: "var(--c-body)" }}
              >
                Category
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {cats.map((c) => (
                  <CatPill
                    key={c.key}
                    cat={c}
                    selected={c.key === cat}
                    onSelect={() => onCat(c.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Note / Source / Fund / (bill) Name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 22,
            }}
          >
            <span style={{ font: `500 13px ${BODY}`, color: "var(--c-body)" }}>
              {asBill ? "Name" : NOTE_LABEL[mode]}
            </span>
            <input
              value={note}
              onChange={(e) => onNote(e.target.value)}
              onFocus={() => setNoteFocus(true)}
              onBlur={() => setNoteFocus(false)}
              placeholder={
                asBill ? "e.g. Electricity, Car EMI" : NOTE_PLACEHOLDER[mode]
              }
              style={{
                width: "100%",
                border: `1px solid ${noteFocus ? "var(--c-accent-3)" : "var(--c-line)"}`,
                borderRadius: 14,
                padding: "0 15px",
                height: 50,
                fontFamily: BODY,
                fontSize: 16,
                color: "var(--c-ink)",
                background: "var(--c-faint)",
                outline: "none",
              }}
            />
          </div>

          {/* CTA slot — while the Amount field is focused (touch), this becomes the
              glassy operator bar; otherwise the Save button. Disabled mid-calc. */}
          {showOps ? (
            <OperatorBar onOp={(op) => amountRef.current?.insertOp(op)} />
          ) : (
            <button
              onClick={onSave}
              disabled={calcActive}
              style={{
                cursor: calcActive ? "not-allowed" : "pointer",
                width: "100%",
                height: 54,
                border: "none",
                borderRadius: 16,
                background: "var(--c-cta)",
                color: "var(--c-cta-fg)",
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 15.5,
                boxShadow: "0 8px 20px -8px rgba(32,27,19,0.28)",
                opacity: calcActive ? 0.5 : 1,
                transition: "opacity .25s ease",
              }}
            >
              {asEmi ? "Add EMI" : asBill ? "Add Bill" : SHEET_TITLE[mode]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
