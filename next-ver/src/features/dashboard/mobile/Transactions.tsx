"use client";

import { BODY, DISPLAY } from "./data";

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
  logged: string;
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

export default function Transactions({ transactions, count, logged }: Props) {
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
          <span style={{ font: `500 12px ${BODY}`, color: "#94a3b8" }}>
            {count} this month · newest first
          </span>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            font: `600 11.5px ${DISPLAY}`,
            color: "#b91c1c",
            background: "linear-gradient(135deg,rgba(239,68,68,0.18),rgba(239,68,68,0.09))",
            border: "1px solid rgba(239,68,68,0.34)",
            borderRadius: 999,
            padding: "5px 10px",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          ₹{logged}
        </span>
      </div>

      {transactions.map((tx, i) => (
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
              <span
                style={{
                  flex: "none",
                  font: `600 10.5px ${DISPLAY}`,
                  color: tx.text,
                  background: `rgba(${tx.rgb},0.13)`,
                  border: `1px solid rgba(${tx.rgb},0.28)`,
                  borderRadius: 999,
                  padding: "2px 8px",
                }}
              >
                {tx.category}
              </span>
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
    </div>
  );
}
