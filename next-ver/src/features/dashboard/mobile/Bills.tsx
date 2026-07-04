"use client";

import { BODY, DISPLAY } from "./data";
import Skeleton from "./Skeleton";
import AddButton from "./AddButton";

// "Bills" card — one-off bills only (EMIs live in their own card). A bill is PAID the
// moment it's added (added == already paid), so there's no Pay button and no paid/total
// header. Rows read like Recent payments: icon + name + amount, tappable to edit. The
// list paginates (page 1 from the dashboard payload, pages 2+ from GET /api/bills).
export interface BillView {
  id: string;
  name: string;
  due: string;
  icon: string;
  amount: string;
  rawAmount: number;
  paid: boolean;
}

interface Props {
  bills: BillView[];
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  onEdit: (b: BillView) => void;
  loading?: boolean;
  onAdd?: () => void; // desktop: contextual "+" in the header → add bill
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

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
        <Skeleton width={54} height={14} />
      </div>
    </div>
  );
}

function BillRow({ bill, onEdit }: { bill: BillView; onEdit: (b: BillView) => void }) {
  return (
    <button
      type="button"
      onClick={() => onEdit(bill)}
      aria-label={`Edit ${bill.name}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "13px 1px",
        borderTop: "1px solid #f1f5f9",
        border: "none",
        borderTopColor: "#f1f5f9",
        borderTopStyle: "solid",
        borderTopWidth: 1,
        background: "transparent",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
          <path d={bill.icon} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ font: `600 14px ${BODY}`, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {bill.name}
          </span>
          {bill.due && (
            <span style={{ font: `500 11.5px ${BODY}`, color: "#94a3b8" }}>{bill.due}</span>
          )}
        </div>
      </div>
      <span style={{ flex: "none", font: `600 14px ${DISPLAY}`, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
        ₹{bill.amount}
      </span>
    </button>
  );
}

function PagerButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        font: `600 12px ${DISPLAY}`,
        color: disabled ? "#cbd5e1" : "#4f46e5",
        background: disabled ? "#f8fafc" : "rgba(79,70,229,0.08)",
        border: `1px solid ${disabled ? "#eef2f7" : "rgba(79,70,229,0.22)"}`,
        borderRadius: 999,
        padding: "6px 16px",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default function Bills({ bills, page, pages, onPageChange, onEdit, loading, onAdd }: Props) {
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
            Bills
          </span>
          <span style={{ font: `500 11.5px ${BODY}`, color: "#94a3b8" }}>
            What you pay monthly — rent, utilities, recharge, insurance
          </span>
        </div>
        {onAdd && <AddButton variant="bill" label="Add bill" onClick={onAdd} />}
      </div>

      {loading
        ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={`skel-${i}`} />)
        : bills.map((bill) => <BillRow key={bill.id} bill={bill} onEdit={onEdit} />)}

      {!loading && pages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            paddingTop: 12,
            marginTop: 4,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <PagerButton label="Prev" disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
          <span style={{ font: `600 11.5px ${DISPLAY}`, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
            {page} / {pages}
          </span>
          <PagerButton label="Next" disabled={page >= pages} onClick={() => onPageChange(page + 1)} />
        </div>
      )}
    </div>
  );
}
