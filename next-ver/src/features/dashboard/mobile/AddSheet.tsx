"use client";

import { useState } from "react";
import {
  BODY,
  DISPLAY,
  NOTE_LABEL,
  NOTE_PLACEHOLDER,
  SHEET_SAVE,
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
  due: string; // bill due date (free text, optional)
  billKind: "once" | "emi"; // bill sub-mode: one-off bill vs multi-month EMI
  emiTotal: string; // EMI: total loan amount
  emiMonths: string; // EMI: duration in months
  onAmount: (v: string) => void;
  onNote: (v: string) => void;
  onCat: (key: CategoryKey) => void;
  onToggleBill: (v: boolean) => void;
  onDue: (v: string) => void;
  onBillKind: (v: "once" | "emi") => void;
  onEmiTotal: (v: string) => void;
  onEmiMonths: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function CatPill({
  cat,
  selected,
  onSelect,
}: {
  cat: Category;
  selected: boolean;
  onSelect: () => void;
}) {
  const base: React.CSSProperties = {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    height: 40,
    padding: "0 15px",
    borderRadius: 999,
    fontFamily: DISPLAY,
    fontWeight: 600,
    fontSize: 13,
  };
  const style: React.CSSProperties = selected
    ? {
        ...base,
        color: cat.text,
        background: `linear-gradient(135deg,rgba(${cat.rgb},0.30),rgba(${cat.rgb},0.15))`,
        border: `1px solid rgba(${cat.rgb},0.50)`,
      }
    : {
        ...base,
        color: "#64748b",
        background: "#fff",
        border: "1px solid #e2e8f0",
      };
  return (
    <button onClick={onSelect} style={style}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: selected ? cat.text : "#cbd5e1",
        }}
      />
      {cat.label}
    </button>
  );
}

export default function AddSheet({
  mode,
  amount,
  note,
  cat,
  cats,
  isBill,
  due,
  billKind,
  emiTotal,
  emiMonths,
  onAmount,
  onNote,
  onCat,
  onToggleBill,
  onDue,
  onBillKind,
  onEmiTotal,
  onEmiMonths,
  onSave,
  onClose,
}: Props) {
  const [noteFocus, setNoteFocus] = useState(false);
  const [dueFocus, setDueFocus] = useState(false);
  const isExpense = mode === "expense";
  const asBill = isExpense && isBill;
  const asEmi = asBill && billKind === "emi";

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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "4px 0 16px",
            }}
          >
            <span
              style={{
                width: 42,
                height: 5,
                borderRadius: 999,
                background: "#e2e8f0",
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
                color: "#0f172a",
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

          {/* Type toggle (expense only): plain expense vs bill / EMI */}
          {isExpense && (
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                marginBottom: 18,
                background: "#f1f5f9",
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
                  label: "Bill / EMI",
                  on: isBill,
                  click: () => onToggleBill(true),
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
                    color: t.on ? "#4f46e5" : "#64748b",
                    background: t.on ? "#fff" : "transparent",
                    boxShadow: t.on ? "0 1px 3px rgba(15,23,42,0.10)" : "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Bill sub-mode toggle: one-off bill vs multi-month EMI */}
          {asBill && (
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                marginBottom: 18,
                background: "#f1f5f9",
                borderRadius: 14,
              }}
            >
              {[
                { label: "One-time", on: billKind === "once", click: () => onBillKind("once") },
                { label: "EMI", on: billKind === "emi", click: () => onBillKind("emi") },
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
                    color: t.on ? "#4f46e5" : "#64748b",
                    background: t.on ? "#fff" : "transparent",
                    boxShadow: t.on ? "0 1px 3px rgba(15,23,42,0.10)" : "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
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
            <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
              {asEmi ? "Monthly amount" : "Amount"}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "0 16px",
                height: 62,
                background: "#f8fafc",
              }}
            >
              <span
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 26,
                  color: "#94a3b8",
                }}
              >
                ₹
              </span>
              <input
                value={amount}
                onChange={(e) => onAmount(e.target.value)}
                inputMode="numeric"
                placeholder="0"
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 28,
                  letterSpacing: "-0.01em",
                  color: "#0f172a",
                  width: "100%",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </div>
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
              <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
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
              marginBottom: asBill ? 18 : 22,
            }}
          >
            <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
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
                border: `1px solid ${noteFocus ? "#818cf8" : "#e2e8f0"}`,
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

          {/* EMI details: total loan + duration */}
          {asEmi && (
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 22,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
                  Total amount
                </span>
                <input
                  value={emiTotal}
                  onChange={(e) => onEmiTotal(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="e.g. 32600"
                  style={{
                    width: "100%",
                    border: "1px solid #e2e8f0",
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 120 }}>
                <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
                  Months
                </span>
                <input
                  value={emiMonths}
                  onChange={(e) => onEmiMonths(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="e.g. 8"
                  style={{
                    width: "100%",
                    border: "1px solid #e2e8f0",
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
            </div>
          )}

          {/* Due date (one-off bill only, optional) */}
          {asBill && !asEmi && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 22,
              }}
            >
              <span style={{ font: `500 13px ${BODY}`, color: "#475569" }}>
                Due date · optional
              </span>
              <input
                value={due}
                onChange={(e) => onDue(e.target.value)}
                onFocus={() => setDueFocus(true)}
                onBlur={() => setDueFocus(false)}
                maxLength={32}
                placeholder="e.g. 5 Jul"
                style={{
                  width: "100%",
                  border: `1px solid ${dueFocus ? "#818cf8" : "#e2e8f0"}`,
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
          )}

          {/* Submit */}
          <button
            onClick={onSave}
            style={{
              cursor: "pointer",
              width: "100%",
              height: 54,
              border: "none",
              borderRadius: 16,
              background: "#4f46e5",
              color: "#fff",
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 15.5,
              boxShadow: "0 8px 20px -8px rgba(79,70,229,0.55)",
            }}
          >
            {asEmi ? "Add EMI" : asBill ? "Add Bill" : SHEET_SAVE[mode]}
          </button>
        </div>
      </div>
    </div>
  );
}
