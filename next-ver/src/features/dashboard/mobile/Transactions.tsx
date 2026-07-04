"use client";

import { useRef } from "react";
import { BODY, DISPLAY } from "./data";
import Skeleton from "./Skeleton";
import AddButton from "./AddButton";
import type { TxView } from "./useFinance";

// "Recent payments" card — pixel from Transactions.dc.html (handoff §5.2).
// No minus sign (debits understood). No trash icon — matches the design reference.
// Tap a row to edit it (amount / title / tag / category) — handled by MobileHome.
//
// Two layouts: mobile uses Prev/Next pagination (default). Desktop passes `fill` →
// the card fills its column, the header pins, and the row list scrolls internally with
// append-on-scroll (onLoadMore) instead of a pager (specs/features/desktop-dashboard.md).
interface Props {
  transactions: TxView[];
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  onEdit: (tx: TxView) => void;
  loading?: boolean;
  fill?: boolean; // desktop: fill column height + internal scroll pagination
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onAdd?: () => void; // desktop: contextual "+" in the header → add expense
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

export default function Transactions({
  transactions,
  page,
  pages,
  onPageChange,
  onEdit,
  loading,
  fill,
  onLoadMore,
  loadingMore,
  onAdd,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Append-on-scroll: when the body nears its bottom, ask for the next page.
  const handleScroll = () => {
    if (!fill || !onLoadMore) return;
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) onLoadMore();
  };

  const rows = (
    <>
      {loading &&
        Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skel-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "11px 1px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0, flex: 1 }}>
              <Skeleton width={`${52 + ((i * 13) % 30)}%`} height={14} />
              <Skeleton width={92} height={11} />
            </div>
            <Skeleton width={48} height={14} />
          </div>
        ))}

      {!loading &&
        transactions.map((tx, i) => (
        <button
          type="button"
          key={`${tx.id}-${i}`}
          onClick={() => onEdit(tx)}
          aria-label={`Edit ${tx.merchant}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "11px 1px",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
            <span
              style={{
                font: `600 14px ${BODY}`,
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {tx.merchant}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <span style={{ font: `500 11.5px ${BODY}`, color: "#94a3b8" }}>{tx.date}</span>
              {tx.tag && (
                <span
                  style={{
                    font: `600 10.5px ${BODY}`,
                    color: `rgb(${tx.rgb})`,
                    background: `rgba(${tx.rgb},0.12)`,
                    border: `1px solid rgba(${tx.rgb},0.28)`,
                    borderRadius: 999,
                    padding: "1px 8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 140,
                  }}
                >
                  {tx.tag}
                </span>
              )}
            </div>
          </div>
          <span
            style={{
              flex: "none",
              font: `600 14px ${DISPLAY}`,
              color: "#b91c1c",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₹{tx.amount}
          </span>
        </button>
      ))}
    </>
  );

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 8,
        flex: "none",
      }}
    >
      <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
        Recent payments
      </span>
      {onAdd && <AddButton variant="expense" label="Add expense" onClick={onAdd} />}
    </div>
  );

  // Desktop: fill the column, pin the header, scroll the rows (append-on-scroll).
  if (fill) {
    return (
      <div
        style={{
          fontFamily: BODY,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 28,
          boxShadow: CARD_SHADOW,
          padding: "22px 22px 14px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        {header}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="subtle-scroll"
          style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 6 }}
        >
          {rows}
          {loadingMore && (
            <div style={{ padding: "12px 0", textAlign: "center", font: `500 11.5px ${BODY}`, color: "#94a3b8" }}>
              Loading…
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile: Prev/Next pager.
  return (
    <div
      style={{
        fontFamily: BODY,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 28,
        boxShadow: CARD_SHADOW,
        padding: "22px 22px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {header}
      {rows}

      {pages > 1 && (
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
          <PagerButton
            label="Prev"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          />
          <span style={{ font: `600 11.5px ${DISPLAY}`, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
            {page} / {pages}
          </span>
          <PagerButton
            label="Next"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          />
        </div>
      )}
    </div>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
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
