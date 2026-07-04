"use client";

import { BODY, DISPLAY, fmt } from "./data";
import Skeleton from "./Skeleton";
import AddButton from "./AddButton";
import type { BillView } from "./Bills";
import type { EmiProgress } from "@/features/dashboard/types/types";

// paid / total pair rendered in the card header (green paid, muted total).
function PaidTotal({ paid, total }: { paid: string; total: string }) {
  return (
    <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
      <span style={{ color: "#047857" }}>₹{paid.toUpperCase()}</span>
      <span style={{ color: "#cbd5e1", margin: "0 5px", fontWeight: 500 }}>/</span>
      <span style={{ color: "#94a3b8" }}>₹{total.toUpperCase()}</span>
    </span>
  );
}

// "EMIs" card — one strip per EMI, rolled up across every month. Tap a strip to edit
// the EMI (name / monthly / total). If this month's instalment is still due, the strip
// carries a Pay button. Header shows Σ paid / Σ total loan (compact, e.g. 4.6K / 32K).
export interface EmiCard {
  emi: EmiProgress;
  thisMonth: BillView | null;
}

interface Props {
  cards: EmiCard[];
  summary: { paid: string; total: string };
  onPay: (id: string) => void;
  onEdit: (emi: EmiProgress) => void;
  loading?: boolean;
  onAdd?: () => void; // desktop: contextual "+" in the header → add EMI
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

function EmiRow({ card, onPay, onEdit }: { card: EmiCard; onPay: (id: string) => void; onEdit: (emi: EmiProgress) => void }) {
  const { emi, thisMonth } = card;
  const cleared = emi.remainingCount === 0;
  const pct = emi.months > 0 ? Math.round((emi.paidCount / emi.months) * 100) : 0;
  const dueNow = Boolean(thisMonth && !thisMonth.paid);
  return (
    <div
      onClick={() => onEdit(emi)}
      style={{
        cursor: "pointer",
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
          Paid ₹{fmt(emi.paidAmount)} / ₹{fmt(emi.total)}
        </span>
        {dueNow ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (thisMonth) onPay(thisMonth.id);
            }}
            style={{
              cursor: "pointer",
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 12.5,
              color: "#4338ca",
              background: "#eef2ff",
              border: "none",
              borderRadius: 999,
              padding: "0 16px",
              height: 32,
            }}
          >
            Pay ₹{fmt(emi.monthly)}
          </button>
        ) : (
          <span style={{ font: `500 11.5px ${BODY}`, color: cleared ? "#047857" : "#64748b", fontVariantNumeric: "tabular-nums" }}>
            {cleared ? "No EMI due" : `₹${fmt(emi.remainingAmount)} left`}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Emis({ cards, summary, onPay, onEdit, loading, onAdd }: Props) {
  return (
    <div
      style={{
        fontFamily: BODY,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 28,
        boxShadow: CARD_SHADOW,
        padding: "22px 22px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 14 }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
          EMIs
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          {loading ? (
            <Skeleton width={96} height={18} />
          ) : cards.length > 0 ? (
            <PaidTotal paid={summary.paid} total={summary.total} />
          ) : null}
          {onAdd && <AddButton variant="bill" label="Add EMI" onClick={onAdd} />}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={`skel-${i}`} width="100%" height={78} radius={16} />
          ))
        ) : cards.length === 0 ? (
          <div style={{ borderTop: "1px solid #f1f5f9", padding: "18px 1px", textAlign: "center" }}>
            <span style={{ font: `500 13px ${BODY}`, color: "#94a3b8" }}>
              No EMIs yet — tap + to add one
            </span>
          </div>
        ) : (
          cards.map((card) => (
            <EmiRow key={card.emi.emi_id} card={card} onPay={onPay} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}
