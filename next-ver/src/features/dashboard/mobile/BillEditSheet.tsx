"use client";

import { useRef, useState } from "react";
import { BODY, DISPLAY } from "./data";
import AmountField, {
  OperatorBar,
  type AmountFieldHandle,
} from "./AmountField";

// BillEditSheet — tap a bill row or an EMI strip to edit it. Same bottom-sheet
// language as EditSheet, but for the bills ledger: a name + amount (and, for EMIs,
// the total loan amount). kind "emi" edits every installment sharing the emi_id.
interface Props {
  kind: "bill" | "emi";
  name: string;
  amount: string; // bill amount, or EMI per-installment (monthly)
  total: string; // EMI total loan (kind "emi" only)
  months: number | null; // EMI installment count (display only)
  saving?: boolean;
  deleting?: boolean;
  onName: (v: string) => void;
  onAmount: (v: string) => void;
  onTotal: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const FIELD_LABEL: React.CSSProperties = {
  font: `500 13px ${BODY}`,
  color: "#475569",
};

export default function BillEditSheet({
  kind,
  name,
  amount,
  total,
  months,
  saving,
  deleting,
  onName,
  onAmount,
  onTotal,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const isEmi = kind === "emi";
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
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: "30px 30px 0 0",
          boxShadow: "0 -18px 60px -18px rgba(15,23,42,0.45)",
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            padding: "10px 22px calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          {/* Grabber */}
          <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 16px" }}>
            <span style={{ width: 42, height: 5, borderRadius: 999, background: "#e2e8f0" }} />
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, letterSpacing: "-0.01em", color: "#0f172a" }}>
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
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#64748b",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            <span style={FIELD_LABEL}>Name</span>
            <input
              value={name}
              onChange={(e) => onName(e.target.value)}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setNameFocus(false)}
              placeholder={isEmi ? "What's this EMI for?" : "What's this bill for?"}
              style={{
                width: "100%",
                border: `1px solid ${nameFocus ? "#818cf8" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: "0 15px",
                height: 50,
                fontFamily: BODY,
                fontSize: 16,
                color: "#0f172a",
                background: "#f8fafc",
                outline: "none",
              }}
            />
          </div>

          {/* Amount (monthly, for EMIs) — shared calculator field, ₹ prefixed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              <span style={FIELD_LABEL}>Total loan{months ? ` · ${months} months` : ""}</span>
              <AmountField
                amount={total}
                onAmount={onTotal}
                placeholder="0"
                prefix="₹"
              />
            </div>
          )}

          {/* Save — or the glassy operator bar while the Amount field is focused */}
          {showOps ? (
            <OperatorBar onOp={(op) => amountRef.current?.insertOp(op)} />
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled}
              style={{
                cursor: saveDisabled ? "default" : "pointer",
                width: "100%",
                height: 54,
                border: "none",
                borderRadius: 16,
                background: "#4f46e5",
                color: "#fff",
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 15.5,
                opacity: saveDisabled ? 0.6 : 1,
                boxShadow: "0 8px 20px -8px rgba(79,70,229,0.55)",
                transition: "opacity .25s ease",
                marginTop: 4,
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            style={{
              cursor: deleting ? "default" : "pointer",
              width: "100%",
              height: 48,
              marginTop: 10,
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#b91c1c",
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 14.5,
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? "Deleting…" : isEmi ? "Delete EMI" : "Delete bill"}
          </button>
        </div>
      </div>
    </div>
  );
}
