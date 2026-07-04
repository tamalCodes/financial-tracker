"use client";

import { BODY, DISPLAY, fmt } from "./data";
import Skeleton from "./Skeleton";
import type { EmiProgress } from "@/features/dashboard/types/types";

// "Bills & EMIs" card — pixel from BillsEmis.dc.html (handoff §5.3).
// Two row states (unpaid / paid). No overdue state. No issuer line.
// EMI installments (isEmi) render like bills; a progress strip above the rows
// rolls each EMI up across every month.
interface BillView {
  id: string;
  name: string;
  due: string;
  icon: string;
  amount: string;
  paid: boolean;
  isEmi: boolean;
}

interface Props {
  bills: BillView[];
  paidTotal: string;
  emis: EmiProgress[];
  onPay: (id: string) => void;
  loading?: boolean;
}

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
        <Skeleton width={64} height={36} radius={999} />
      </div>
    </div>
  );
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

function UnpaidRow({ bill, onPay }: { bill: BillView; onPay: (id: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 1px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
          <path d={bill.icon} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ font: `600 14px ${BODY}`, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {bill.name}
          </span>
          <span style={{ font: `500 11.5px ${BODY}`, color: "#94a3b8" }}>Due {bill.due}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        <span style={{ font: `600 14px ${DISPLAY}`, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
          ₹{bill.amount}
        </span>
        <button
          onClick={() => onPay(bill.id)}
          style={{
            cursor: "pointer",
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 13,
            color: "#4338ca",
            background: "#eef2ff",
            border: "none",
            borderRadius: 999,
            padding: "0 18px",
            height: 36,
          }}
        >
          Pay
        </button>
      </div>
    </div>
  );
}

function PaidRow({ bill }: { bill: BillView }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 1px", opacity: 0.62 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
          <path d="M4 10.5l4 4 8-9" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span
            style={{
              font: `600 14px ${BODY}`,
              color: "#475569",
              textDecoration: "line-through",
              textDecorationColor: "#cbd5e1",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {bill.name}
          </span>
          <span style={{ font: `500 11.5px ${BODY}`, color: "#94a3b8" }}>{bill.due}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        <span style={{ font: `600 14px ${DISPLAY}`, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
          ₹{bill.amount}
        </span>
        <span style={{ font: `600 12px ${DISPLAY}`, color: "#047857" }}>Paid</span>
      </div>
    </div>
  );
}

// Roll-up strip for one EMI: name, installments paid, amounts, progress bar.
function EmiProgressRow({ emi }: { emi: EmiProgress }) {
  const cleared = emi.remainingCount === 0;
  const pct = emi.months > 0 ? Math.round((emi.paidCount / emi.months) * 100) : 0;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 16,
        background: "#f8fafc",
        border: "1px solid #eef2ff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ font: `600 13.5px ${BODY}`, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {emi.name}
        </span>
        <span style={{ font: `600 12px ${DISPLAY}`, color: cleared ? "#047857" : "#4338ca" }}>
          {cleared ? "Cleared" : `${emi.paidCount} of ${emi.months} paid`}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: cleared ? "#047857" : "#4f46e5",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ font: `500 11.5px ${BODY}`, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
          Paid ₹{fmt(emi.paidAmount)}
        </span>
        <span style={{ font: `500 11.5px ${BODY}`, color: cleared ? "#047857" : "#64748b", fontVariantNumeric: "tabular-nums" }}>
          {cleared ? "No EMI due" : `₹${fmt(emi.remainingAmount)} left`}
        </span>
      </div>
    </div>
  );
}

export default function BillsEmis({ bills, paidTotal, emis, onPay, loading }: Props) {
  // "No EMI due this month" once every EMI installment for the month is paid.
  const emiDueThisMonth = bills.some((b) => b.isEmi && !b.paid);
  const hasEmis = emis.length > 0;
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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingBottom: 14 }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
          Bills &amp; EMIs
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={{ font: `500 11px ${BODY}`, color: "#64748b" }}>Paid this month</span>
          {loading ? (
            <Skeleton width={70} height={18} style={{ marginTop: 2 }} />
          ) : (
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: "#047857", fontVariantNumeric: "tabular-nums" }}>
              ₹{paidTotal}
            </span>
          )}
        </div>
      </div>

      {/* EMI progress roll-up (across all months) */}
      {!loading && hasEmis && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 6 }}>
          {emis.map((emi) => (
            <EmiProgressRow key={emi.emi_id} emi={emi} />
          ))}
          {!emiDueThisMonth && (
            <span style={{ font: `500 12px ${BODY}`, color: "#047857", paddingTop: 2 }}>
              No EMI due this month — you&apos;re all caught up.
            </span>
          )}
        </div>
      )}

      {loading
        ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={`skel-${i}`} />)
        : bills.map((bill) => (
            <div key={bill.id} style={{ borderTop: "1px solid #f1f5f9" }}>
              {bill.paid ? <PaidRow bill={bill} /> : <UnpaidRow bill={bill} onPay={onPay} />}
            </div>
          ))}
    </div>
  );
}
