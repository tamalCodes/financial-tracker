"use client";

import { useRef, useState } from "react";
import { BODY, DISPLAY } from "./data";
import { useMediaQuery } from "../hooks/useMediaQuery";
import MonthPicker from "./MonthPicker";
import AmountField, {
  OperatorBar,
  type AmountFieldHandle,
} from "./AmountField";

// BillEditSheet — tap a bill row or an EMI strip to edit it. On phones it's a
// bottom sheet (single column); on desktop (≥1024px) it's a centered dialog that
// uses the extra width — EMIs lay their fields out in a 2-column grid. kind "emi"
// edits every installment sharing the emi_id.
interface Props {
  kind: "bill" | "emi";
  name: string;
  amount: string; // bill amount, or EMI per-installment (monthly)
  total: string; // EMI total loan (kind "emi" only)
  months: number | null; // EMI installment count (display only)
  paidCount: number; // EMI: installments already paid (0..months)
  startMonth: string; // EMI: month key of the first installment (emi_seq 1)
  saving?: boolean;
  deleting?: boolean;
  onName: (v: string) => void;
  onAmount: (v: string) => void;
  onTotal: (v: string) => void;
  onPaidCount: (v: number) => void;
  onStartMonth: (monthKey: string) => void; // EMI: re-anchor schedule to a month
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const FIELD_LABEL: React.CSSProperties = {
  font: `500 13px ${BODY}`,
  color: "var(--c-body)",
};

const FIELD_COL: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minWidth: 0,
};

export default function BillEditSheet({
  kind,
  name,
  amount,
  total,
  months,
  paidCount,
  startMonth,
  saving,
  deleting,
  onName,
  onAmount,
  onTotal,
  onPaidCount,
  onStartMonth,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const isEmi = kind === "emi";
  // Desktop (≥1024px): centered dialog card; below that, mobile bottom sheet.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // EMIs get the wide 2-column treatment on desktop; bills stay single column.
  const twoCol = isDesktop && isEmi;
  const [nameFocus, setNameFocus] = useState(false);
  const [calcActive, setCalcActive] = useState(false);
  const saveDisabled = saving || calcActive;

  // Amount focused on touch → CTA slot becomes the glassy operator bar (see EditSheet).
  const amountRef = useRef<AmountFieldHandle>(null);
  const [amountFocus, setAmountFocus] = useState(false);
  // SSR-safe: initial paint has amountFocus=false so showOps is false either way (no mismatch).
  const [touch] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia?.("(pointer: coarse)").matches ?? false
      : false
  );
  const showOps = touch && amountFocus;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15,23,42,0.40)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        alignItems: isDesktop ? "center" : "flex-end",
        justifyContent: "center",
        padding: isDesktop ? 24 : 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: twoCol ? 660 : 460,
          maxWidth: "100%",
          background: "var(--c-surface)",
          borderRadius: isDesktop ? 24 : "30px 30px 0 0",
          boxShadow: isDesktop
            ? "0 24px 70px -20px rgba(15,23,42,0.45)"
            : "0 -18px 60px -18px rgba(15,23,42,0.45)",
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            padding: isDesktop
              ? "22px 28px 28px"
              : "10px 22px calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          {/* Grabber (mobile bottom-sheet affordance only) */}
          <div style={{ display: isDesktop ? "none" : "flex", justifyContent: "center", padding: "4px 0 16px" }}>
            <span style={{ width: 42, height: 5, borderRadius: 999, background: "var(--c-line)" }} />
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, letterSpacing: "-0.01em", color: "var(--c-ink)" }}>
              {isEmi ? "Edit EMI" : "Edit bill"}
            </span>
            <button
              type="button"
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

          {/* Fields — single column on mobile / bills, 2-col grid for EMIs on desktop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: twoCol ? "1fr 1fr" : "1fr",
              columnGap: 20,
              rowGap: 18,
              marginBottom: 22,
            }}
          >
            {/* Name — spans the full width */}
            <div style={{ ...FIELD_COL, gridColumn: twoCol ? "1 / -1" : "auto" }}>
              <span style={FIELD_LABEL}>Name</span>
              <input
                value={name}
                onChange={(e) => onName(e.target.value)}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
                placeholder={isEmi ? "What's this EMI for?" : "What's this bill for?"}
                style={{
                  width: "100%",
                  border: `1px solid ${nameFocus ? "var(--c-accent-3)" : "var(--c-line)"}`,
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

            {/* Amount (monthly, for EMIs) — shared calculator field, ₹ prefixed */}
            <div style={FIELD_COL}>
              <span style={FIELD_LABEL}>{isEmi ? "Monthly instalment" : "Amount"}</span>
              <AmountField
                ref={amountRef}
                amount={amount}
                onAmount={onAmount}
                placeholder="0"
                prefix="₹"
                onCalcActiveChange={setCalcActive}
                onFocusChange={setAmountFocus}
              />
            </div>

            {/* EMI total loan */}
            {isEmi && (
              <div style={FIELD_COL}>
                <span style={FIELD_LABEL}>Total loan{months ? ` · ${months} months` : ""}</span>
                <AmountField
                  amount={total}
                  onAmount={onTotal}
                  placeholder="0"
                  prefix="₹"
                />
              </div>
            )}

            {/* EMI start month — re-anchor the whole schedule via a month + year
                picker. Pick a past month to back-date already-paid installments. */}
            {isEmi && startMonth && (
              <div style={FIELD_COL}>
                <span style={FIELD_LABEL}>Started</span>
                <MonthPicker value={startMonth} onChange={onStartMonth} />
              </div>
            )}

            {/* EMI months paid — record how many installments are already paid.
                Flips the first N installments' paid flags on save (feeds spend). */}
            {isEmi && months != null && months > 0 && (
              <div style={FIELD_COL}>
                <span style={FIELD_LABEL}>Months paid</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid var(--c-line)",
                    borderRadius: 16,
                    background: "var(--c-faint)",
                    height: 62,
                    padding: "0 10px 0 16px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: DISPLAY,
                      fontWeight: 600,
                      fontSize: 28,
                      letterSpacing: "-0.01em",
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--c-ink)",
                    }}
                  >
                    {paidCount}
                    <span style={{ fontSize: 15, fontWeight: 500, color: "var(--c-muted)" }}>
                      {" "}
                      / {months}
                    </span>
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { label: "−", delta: -1, disabled: paidCount <= 0 },
                      { label: "+", delta: 1, disabled: paidCount >= months },
                    ].map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        onClick={() => onPaidCount(paidCount + b.delta)}
                        disabled={b.disabled}
                        aria-label={b.delta > 0 ? "One more paid" : "One less paid"}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          border: "1px solid rgba(79,70,229,0.18)",
                          background:
                            "linear-gradient(180deg, rgba(99,102,241,0.10), rgba(79,70,229,0.06))",
                          color: "var(--c-accent-2)",
                          fontSize: 24,
                          fontWeight: 600,
                          lineHeight: 1,
                          cursor: b.disabled ? "default" : "pointer",
                          opacity: b.disabled ? 0.4 : 1,
                          boxShadow: "inset 0 1px 0 var(--c-glass)",
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions — Save + Delete side by side on desktop, stacked on mobile.
              While the Amount field is focused (touch), Save becomes the operator bar. */}
          {showOps ? (
            <OperatorBar onOp={(op) => amountRef.current?.insertOp(op)} />
          ) : (
            <div style={{ display: "flex", flexDirection: isDesktop ? "row-reverse" : "column", gap: 10 }}>
              <button
                type="button"
                onClick={onSave}
                disabled={saveDisabled}
                style={{
                  cursor: saveDisabled ? "default" : "pointer",
                  flex: isDesktop ? 2 : undefined,
                  width: isDesktop ? undefined : "100%",
                  height: 54,
                  border: "none",
                  borderRadius: 16,
                  background: "var(--c-accent-2)",
                  color: "var(--c-onaccent)",
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 15.5,
                  opacity: saveDisabled ? 0.6 : 1,
                  boxShadow: "0 8px 20px -8px rgba(79,70,229,0.55)",
                  transition: "opacity .25s ease",
                }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                style={{
                  cursor: deleting ? "default" : "pointer",
                  flex: isDesktop ? 1 : undefined,
                  width: isDesktop ? undefined : "100%",
                  height: isDesktop ? 54 : 48,
                  borderRadius: 16,
                  border: "1px solid var(--c-line)",
                  background: "var(--c-surface)",
                  color: "var(--c-expense)",
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 14.5,
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting…" : isEmi ? "Delete EMI" : "Delete bill"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
