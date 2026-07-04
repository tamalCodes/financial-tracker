"use client";

import { BODY, DISPLAY } from "./data";
import Skeleton from "./Skeleton";
import AddButton from "./AddButton";

// "Income" card — mirrors BillsEmis layout (handoff §5.3), credit semantics (green).
// Renders the month's credits[] as read-only rows; no actions.
interface IncomeView {
  id: string;
  name: string;
  date: string;
  amount: string;
}

interface Props {
  income: IncomeView[];
  incomeTotal: string;
  incomeCompact: string;
  loading?: boolean;
  onAdd?: () => void; // desktop: contextual "+" in the header → add income
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

// Down-left arrow into a wallet — "money in".
const INCOME_ICON =
  "M14 6l-8 8M6 14h5M6 14v-5";

function SkeletonRow() {
  return (
    <div style={{ borderTop: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 1px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0, flex: 1 }}>
          <Skeleton width={20} height={20} radius={6} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 }}>
            <Skeleton width={120} height={14} />
            <Skeleton width={70} height={11} />
          </div>
        </div>
        <Skeleton width={70} height={16} />
      </div>
    </div>
  );
}

function IncomeRow({ item }: { item: IncomeView }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 1px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#047857" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
          <path d={INCOME_ICON} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ font: `600 14px ${BODY}`, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.name}
          </span>
          <span style={{ font: `500 11.5px ${BODY}`, color: "#94a3b8" }}>{item.date}</span>
        </div>
      </div>
      <span style={{ font: `600 14px ${DISPLAY}`, color: "#047857", fontVariantNumeric: "tabular-nums", flex: "none" }}>
        +₹{item.amount}
      </span>
    </div>
  );
}

export default function Income({ income, incomeCompact, loading, onAdd }: Props) {
  return (
    <div
      style={{
        fontFamily: BODY,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 28,
        boxShadow: CARD_SHADOW,
        padding: "22px 22px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 14 }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
          Income
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          {loading ? (
            <Skeleton width={56} height={24} radius={999} />
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                font: `600 11.5px ${DISPLAY}`,
                color: "#047857",
                background:
                  "linear-gradient(135deg,rgba(16,185,129,0.18),rgba(16,185,129,0.09))",
                border: "1px solid rgba(16,185,129,0.34)",
                borderRadius: 999,
                padding: "5px 10px",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                flex: "none",
              }}
            >
              ₹{incomeCompact}
            </span>
          )}
          {onAdd && <AddButton variant="income" label="Add income" onClick={onAdd} />}
        </div>
      </div>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={`skel-${i}`} />)
      ) : income.length === 0 ? (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "18px 1px", textAlign: "center" }}>
          <span style={{ font: `500 13px ${BODY}`, color: "#94a3b8" }}>No income logged this month</span>
        </div>
      ) : (
        income.map((item) => (
          <div key={item.id} style={{ borderTop: "1px solid #f1f5f9" }}>
            <IncomeRow item={item} />
          </div>
        ))
      )}
    </div>
  );
}
