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
      <span style={{ color: "var(--c-credit)" }}>₹{paid.toUpperCase()}</span>
      <span style={{ color: "var(--c-line-strong)", margin: "0 5px", fontWeight: 500 }}>/</span>
      <span style={{ color: "var(--c-muted)" }}>₹{total.toUpperCase()}</span>
    </span>
  );
}

// "EMIs" card — one strip per EMI, rolled up across every month. Tap a strip to edit
// the EMI (name / monthly / total). If this month's instalment is still due, the strip
// carries a Pay button. Header shows Σ paid / Σ total loan (compact, e.g. 4.6K / 32K).
interface EmiCard {
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
  "0 1px 2px rgba(32,27,19,0.04), 0 14px 30px -22px rgba(32,27,19,0.30)";

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
        background: "var(--c-faint)",
        border: "1px solid var(--c-accent-bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ font: `600 13.5px ${BODY}`, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {emi.name}
        </span>
        <span style={{ font: `600 12px ${DISPLAY}`, color: cleared ? "var(--c-credit)" : "var(--c-accent)" }}>
          {cleared ? "Cleared" : `${emi.paidCount} of ${emi.months} paid`}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "var(--c-line)", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: cleared ? "var(--c-credit)" : "var(--c-accent-2)",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ font: `500 11.5px ${BODY}`, color: "var(--c-muted)", fontVariantNumeric: "tabular-nums" }}>
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
              color: "var(--c-accent)",
              background: "var(--c-accent-bg)",
              border: "none",
              borderRadius: 999,
              padding: "0 16px",
              height: 32,
            }}
          >
            Pay ₹{fmt(emi.monthly)}
          </button>
        ) : (
          <span style={{ font: `500 11.5px ${BODY}`, color: cleared ? "var(--c-credit)" : "var(--c-body-2)", fontVariantNumeric: "tabular-nums" }}>
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
        background: "var(--c-surface)",
        border: "1px solid var(--c-line)",
        borderRadius: 28,
        boxShadow: CARD_SHADOW,
        padding: "22px 22px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 14 }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "var(--c-ink)" }}>
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
          <div style={{ borderTop: "1px solid var(--c-field)", padding: "18px 1px", textAlign: "center" }}>
            <span style={{ font: `500 13px ${BODY}`, color: "var(--c-muted)" }}>
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
