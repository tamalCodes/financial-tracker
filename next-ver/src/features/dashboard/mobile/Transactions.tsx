"use client";

import { useState } from "react";
import { BODY, DISPLAY } from "./data";
import Skeleton from "./Skeleton";

// "Recent payments" card — pixel from Transactions.dc.html (handoff §5.2).
// No minus sign (debits understood). No trash icon — matches the design reference.
interface TxView {
  merchant: string;
  category: string;
  date: string;
  amount: string;
  rgb: string;
  text: string;
}

interface Props {
  transactions: TxView[];
  count: number;
  logged: string; // full grouped total, e.g. "28,134" — used in the tooltip
  loggedCompact: string; // chip label, e.g. "28.1k"
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

export default function Transactions({
  transactions,
  count,
  logged,
  loggedCompact,
  page,
  pages,
  onPageChange,
  loading,
}: Props) {
  const [tipOpen, setTipOpen] = useState(false);

  // TEMP diagnostic — confirms the paginated component renders (browser console).
  console.log(
    `[FT][Transactions] rows=${transactions.length} page=${page} pages=${pages}`
  );

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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          paddingBottom: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
            Recent payments
          </span>
        </div>
        <div style={{ position: "relative", flex: "none" }}>
          {loading ? (
            <Skeleton width={56} height={24} radius={999} />
          ) : (
          <>
          <button
            type="button"
            onClick={() => setTipOpen((v) => !v)}
            onBlur={() => setTipOpen(false)}
            aria-expanded={tipOpen}
            aria-label={`Total logged ₹${logged} across ${count} payments`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              font: `600 11.5px ${DISPLAY}`,
              color: "#b91c1c",
              background:
                "linear-gradient(135deg,rgba(239,68,68,0.18),rgba(239,68,68,0.09))",
              border: "1px solid rgba(239,68,68,0.34)",
              borderRadius: 999,
              padding: "5px 10px",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            ₹{loggedCompact}
          </button>
          {tipOpen && (
            <div
              role="tooltip"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                zIndex: 10,
                font: `500 11.5px ${BODY}`,
                color: "#e2e8f0",
                background: "rgba(15,23,42,0.92)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(148,163,184,0.25)",
                borderRadius: 12,
                padding: "8px 11px",
                boxShadow: "0 12px 30px -16px rgba(15,23,42,0.7)",
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 600 }}>₹{logged}</span> spent ·{" "}
              {count} payment{count === 1 ? "" : "s"}
            </div>
          )}
          </>
          )}
        </div>
      </div>

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
        <div
          key={`${tx.merchant}-${i}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "11px 1px",
            borderTop: "1px solid #f1f5f9",
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
        </div>
      ))}

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
