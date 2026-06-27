"use client";

import { useState } from "react";
import { BODY, DISPLAY, type Fd, type Fund, type SipRow } from "./data";

// Portfolio panel — pixel from Investments.dc.html (handoff §5.4). Tab = local UI state.
interface Props {
  portfolioTotal: string;
  fds: Fd[];
  funds: Fund[];
  sips: SipRow[];
}

const CARD_SHADOW =
  "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)";

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "12px 2px",
  borderBottom: "1px solid #f1f5f9",
};

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        cursor: "pointer",
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: 12.5,
        border: "none",
        borderRadius: 9,
        padding: "9px 0",
        transition: "all .15s",
        background: active ? "#fff" : "transparent",
        color: active ? "#0f172a" : "#64748b",
        boxShadow: active ? "0 1px 2px rgba(15,23,42,0.12)" : "none",
      }}
    >
      {children}
    </button>
  );
}

export default function Investments({ portfolioTotal, fds, funds, sips }: Props) {
  const [tab, setTab] = useState<"holdings" | "sips">("holdings");

  return (
    <div
      style={{
        fontFamily: BODY,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 28,
        boxShadow: CARD_SHADOW,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ font: `500 12.5px ${BODY}`, color: "#64748b" }}>Portfolio value</span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: "-0.025em",
            color: "#0f172a",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ₹{portfolioTotal}
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 13, padding: 4 }}>
        <TabButton active={tab === "holdings"} onClick={() => setTab("holdings")}>
          Holdings
        </TabButton>
        <TabButton active={tab === "sips"} onClick={() => setTab("sips")}>
          Active SIPs
        </TabButton>
      </div>

      {tab === "holdings" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <span style={SECTION_LABEL}>Fixed Deposits</span>
            {fds.map((fd) => (
              <div key={fd.name} style={ROW}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ font: `600 13.5px ${BODY}`, color: "#0f172a" }}>{fd.name}</span>
                  <span style={{ font: `500 11px ${BODY}`, color: "#94a3b8" }}>{fd.sub}</span>
                </div>
                <span style={{ font: `600 14px ${DISPLAY}`, color: "#0f172a", fontVariantNumeric: "tabular-nums", flex: "none" }}>
                  ₹{fd.amount}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <span style={SECTION_LABEL}>Mutual Funds</span>
            {funds.map((fund) => (
              <div key={fund.name} style={ROW}>
                <span
                  style={{
                    font: `600 13.5px ${BODY}`,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: 0,
                  }}
                >
                  {fund.name}
                </span>
                <span style={{ font: `600 14px ${DISPLAY}`, color: "#0f172a", fontVariantNumeric: "tabular-nums", flex: "none" }}>
                  ₹{fund.current}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <span style={SECTION_LABEL}>Active SIPs</span>
          {sips.map((sip) => (
            <div key={sip.name} style={ROW}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ font: `600 13.5px ${BODY}`, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sip.name}
                </span>
                <span style={{ font: `500 11px ${BODY}`, color: "#94a3b8" }}>Due {sip.due}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flex: "none" }}>
                <span style={{ font: `600 14px ${DISPLAY}`, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                  ₹{sip.monthly}/mo
                </span>
                <span style={{ font: `500 11px ${BODY}`, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                  Paid ₹{sip.paid}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
