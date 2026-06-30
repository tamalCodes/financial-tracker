"use client";

import { BODY, DISPLAY } from "./data";
import Skeleton from "./Skeleton";

// "Bills & EMIs" card — pixel from BillsEmis.dc.html (handoff §5.3).
// Two row states (unpaid / paid). No overdue state. No issuer line.
interface BillView {
  id: string;
  name: string;
  due: string;
  icon: string;
  amount: string;
  paid: boolean;
}

interface Props {
  bills: BillView[];
  paidTotal: string;
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

export default function BillsEmis({ bills, paidTotal, onPay, loading }: Props) {
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
