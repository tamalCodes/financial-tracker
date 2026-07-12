"use client";

import { cloneElement, isValidElement, useMemo, useState } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BODY, DISPLAY, type SipRow } from "./data";
import { toast } from "./toast";

export default function SipPaymentSheet({ sips, currentMonth, onClose, onDone }: { sips: SipRow[]; currentMonth: string; onClose: () => void; onDone: () => Promise<void> | void }) {
  const [selected, setSelected] = useState(() => new Set(sips.map((sip) => sip.id)));
  const [debitBalance, setDebitBalance] = useState(true);
  const [saving, setSaving] = useState(false);
  const total = useMemo(() => sips.filter((sip) => selected.has(sip.id)).reduce((sum, sip) => sum + sip.rawMonthly, 0), [selected, sips]);
  const toggle = (id: string) => setSelected((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const save = async () => {
    if (!selected.size || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sip-payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentMonth, sipIds: [...selected], debitBalance }) });
      const body = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "Could not record SIPs");
      await onDone();
      toast.success(debitBalance ? "SIPs recorded and balance debited" : "SIPs recorded without balance debit");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't record SIPs");
    } finally { setSaving(false); }
  };
  return <Overlay onClose={onClose}><div style={CARD}>
    <div style={HEADER}><div><div style={TITLE}>Record SIPs</div><div style={SUB}>This month · choose paid funds</div></div><button onClick={onClose} style={CLOSE}>✕</button></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{sips.map((sip) => <label key={sip.id} style={ROW}><input type="checkbox" checked={selected.has(sip.id)} onChange={() => toggle(sip.id)} /><span style={{ flex: 1, minWidth: 0 }}>{sip.name}</span><b>₹{sip.monthly}</b></label>)}</div>
    <label style={{ ...ROW, marginTop: 14, alignItems: "flex-start" }}><input type="checkbox" checked={debitBalance} onChange={(e) => setDebitBalance(e.target.checked)} /><span><b>Deduct from Left in bank</b><small style={SUB}>Creates this month’s investment entry. Turn off if bank debit has not happened yet.</small></span></label>
    <div style={TOTAL}><span>Total SIPs</span><b>₹{total.toLocaleString("en-IN")}</b></div>
    <button disabled={!selected.size || saving} onClick={save} style={{ ...SAVE, opacity: !selected.size || saving ? .55 : 1 }}>{saving ? "Recording…" : `Record ₹${total.toLocaleString("en-IN")}`}</button>
  </div></Overlay>;
}

// Bottom sheet on mobile; centered dialog card on desktop (≥1024px). The card's
// top-only radius + flush-bottom is overridden to a full-radius floating card on
// desktop, so every consumer (SipPaymentSheet, PortfolioManager) tracks together.
export function Overlay({ children, onClose, desktopWidth = 500 }: { children: React.ReactNode; onClose: () => void; desktopWidth?: number }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const card = isDesktop && isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ style?: React.CSSProperties }>, {
        style: { ...(children as React.ReactElement<{ style?: React.CSSProperties }>).props.style, borderRadius: 24, maxHeight: "calc(100vh - 48px)", overflowY: "auto" },
      })
    : children;
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(2,6,14,.62)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: isDesktop ? "center" : "flex-end", justifyContent: "center", padding: isDesktop ? 24 : 0 }}><div onClick={(e) => e.stopPropagation()} style={{ width: isDesktop ? desktopWidth : 500, maxWidth: "100%" }}>{card}</div></div>;
}
export const CARD: React.CSSProperties = { background: "var(--c-surface)", border: "1px solid var(--c-line-strong)", borderRadius: "28px 28px 0 0", padding: "22px 22px calc(22px + env(safe-area-inset-bottom))", fontFamily: BODY };
export const HEADER: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 20 };
export const TITLE: React.CSSProperties = { font: `600 21px ${DISPLAY}`, color: "var(--c-ink)" };
export const SUB: React.CSSProperties = { display: "block", font: `500 11.5px ${BODY}`, lineHeight: 1.45, color: "var(--c-muted)", marginTop: 3 };
export const CLOSE: React.CSSProperties = { cursor: "pointer", width: 34, height: 34, borderRadius: 10, border: "1px solid var(--c-line)", background: "var(--c-faint)", color: "var(--c-body-2)" };
export const ROW: React.CSSProperties = { display: "flex", gap: 10, padding: "11px 2px", borderBottom: "1px solid var(--c-field)", font: `600 13px ${BODY}`, color: "var(--c-ink)", alignItems: "center" };
export const TOTAL: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "16px 0", font: `600 15px ${DISPLAY}`, color: "var(--c-ink)" };
export const SAVE: React.CSSProperties = { cursor: "pointer", width: "100%", border: "none", borderRadius: 13, background: "var(--c-accent)", color: "white", padding: "13px", font: `600 14px ${DISPLAY}` };
