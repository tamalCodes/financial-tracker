"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BODY, DISPLAY } from "./data";
import AmountField, { OperatorBar, type AmountFieldHandle } from "./AmountField";
import { CARD, CLOSE, HEADER, Overlay, ROW, SAVE, SUB, TITLE } from "./SipPaymentSheet";
import Skeleton from "./Skeleton";
import { toast } from "./toast";

type Holding = { id: string; kind: "fd" | "mutual_fund"; name: string; current_value: number; rate: number | null; maturity_date: string | null };
type Sip = { id: string; name: string; monthly: number; due_date: string | null; paid_total: number };
type Tab = "holdings" | "sips" | "total";

const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid var(--c-line)", borderRadius: 10, padding: "10px 11px", background: "var(--c-faint)", color: "var(--c-ink)", font: `500 13px ${BODY}` };
const action: React.CSSProperties = { cursor: "pointer", border: "1px solid var(--c-line)", borderRadius: 9, background: "var(--c-faint)", color: "var(--c-body-2)", padding: "7px 9px", font: `600 11px ${DISPLAY}` };
const typeButton: React.CSSProperties = { cursor: "pointer", flex: 1, border: "1px solid var(--c-line)", borderRadius: 10, padding: "9px 10px", background: "var(--c-faint)", color: "var(--c-muted)", font: `600 12px ${DISPLAY}` };
// Desktop right-panel wrapper for the add/edit form — glassy card that stays put.
const panel: React.CSSProperties = { border: "1px solid var(--c-line)", borderRadius: 16, padding: 16, background: "var(--c-faint)" };
// Mobile inline edit card (accent-tinted, expands under the tapped row).
const editCard: React.CSSProperties = { padding: 12, margin: "6px 0 8px", border: "1px solid var(--c-accent-4)", borderRadius: 14, background: "var(--c-accent-bg)" };

export default function PortfolioManager({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> | void }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("holdings");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [sips, setSips] = useState<Sip[]>([]);
  const [total, setTotal] = useState("");
  const [editing, setEditing] = useState<Holding | Sip | null>(null);
  const [kind, setKind] = useState<"fd" | "mutual_fund">("mutual_fund");
  const [name, setName] = useState(""); const [amount, setAmount] = useState(""); const [due, setDue] = useState(""); const [saving, setSaving] = useState(false);
  const [calcActive, setCalcActive] = useState(false);
  const [amountFocus, setAmountFocus] = useState(false);
  const amountRef = useRef<AmountFieldHandle>(null);
  const load = async () => { const r = await fetch("/api/portfolio-panel"); if (!r.ok) throw new Error("Could not load portfolio"); const d = await r.json() as { value: number; holdings: Holding[]; sips: Sip[] }; setHoldings(d.holdings ?? []); setSips(d.sips ?? []); setTotal(String(d.value ?? 0)); };
  useEffect(() => { load().catch((e) => toast.error(e.message)).finally(() => setLoading(false)); }, []);
  const reset = () => { setEditing(null); setKind("mutual_fund"); setName(""); setAmount(""); setDue(""); setCalcActive(false); setAmountFocus(false); };
  const editHolding = (h: Holding) => { setEditing(h); setKind(h.kind); setName(h.name); setAmount(String(h.current_value)); setDue(h.maturity_date ?? ""); };
  const editSip = (s: Sip) => { setEditing(s); setName(s.name); setAmount(String(s.monthly)); setDue(s.due_date ?? ""); };
  const save = async () => {
    const numeric = Number(amount); if (!name.trim() || !Number.isFinite(numeric) || numeric <= 0 || saving) return;
    setSaving(true);
    try {
      const path = tab === "holdings" ? "/api/holdings" : "/api/sips";
      const isHolding = tab === "holdings";
      const body = isHolding ? { ...(editing ? { id: editing.id } : {}), kind, name: name.trim(), current_value: numeric, ...(kind === "fd" ? { maturity_date: due.trim() || undefined } : {}) } : { ...(editing ? { id: editing.id } : {}), name: name.trim(), monthly: numeric, due_date: due.trim() || undefined };
      const res = await fetch(path, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Could not save");
      await load(); await onDone(); reset(); toast.success(editing ? "Portfolio item updated" : "Portfolio item added");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save"); } finally { setSaving(false); }
  };
  const remove = async (id: string) => { if (!confirm("Delete this portfolio item?")) return; try { const path = tab === "holdings" ? "/api/holdings" : "/api/sips"; const r = await fetch(`${path}?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!r.ok) throw new Error("Could not delete"); await load(); await onDone(); reset(); toast.success("Portfolio item deleted"); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete"); } };
  const saveTotal = async () => { const value = Number(total); if (!Number.isFinite(value) || value < 0) return; setSaving(true); try { const r = await fetch("/api/portfolio", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) }); if (!r.ok) throw new Error("Could not update portfolio value"); await onDone(); toast.success("Portfolio value updated"); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update portfolio value"); } finally { setSaving(false); } };

  const items = tab === "holdings" ? holdings : sips;
  const heading = tab === "holdings" ? "holding" : "SIP";

  // Bare add/edit fields — wrapped by the caller (mobile inline card vs desktop panel).
  const formFields = (isEdit: boolean) => <>
    <b style={{ font: `600 14px ${DISPLAY}`, color: "var(--c-ink)" }}>{isEdit ? "Edit" : "Add"} {heading}</b>
    {tab === "holdings" && <div role="group" aria-label="Holding type" style={{ display: "flex", gap: 8, marginTop: 10 }}>
      {([['mutual_fund', 'Mutual fund'], ['fd', 'Fixed deposit']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} style={{ ...typeButton, ...(kind === value ? { border: "1px solid var(--c-accent-4)", background: "var(--c-accent-bg)", color: "var(--c-accent-2)", boxShadow: "inset 0 0 0 1px var(--c-accent-4)" } : {}) }}>{label}</button>)}
    </div>}
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tab === "holdings" ? "Fund or FD name" : "Fund name"} style={{ ...input, marginTop: 10 }} />
    <div style={{ marginTop: 10 }}><AmountField ref={amountRef} amount={amount} onAmount={setAmount} prefix="₹" placeholder="Try 49,986 + 500" onCalcActiveChange={setCalcActive} onFocusChange={setAmountFocus} /></div>
    {amountFocus && <div style={{ marginTop: 8 }}><OperatorBar onOp={(op) => amountRef.current?.insertOp(op)} /></div>}
    <input value={due} onChange={(e) => setDue(e.target.value)} placeholder={tab === "holdings" && kind === "fd" ? "Maturity date (optional)" : "Due date (optional)"} style={{ ...input, marginTop: 10 }} />
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button onClick={save} disabled={saving || calcActive} style={{ ...SAVE, flex: 1, opacity: saving || calcActive ? .55 : 1 }}>{saving ? "Saving…" : isEdit ? "Save changes" : "Add"}</button>{isEdit && <button onClick={reset} style={action}>Cancel</button>}</div>
  </>;

  // A single holding/SIP row. On mobile the edit form expands inline beneath it;
  // on desktop editing happens in the sticky right panel, so no inline expansion.
  const rows = (inlineEdit: boolean) => <div style={{ display: "flex", flexDirection: "column", gap: inlineEdit ? 1 : 5 }}>
    {items.length === 0 && <div style={{ ...SUB, textAlign: "center", padding: "22px 0" }}>No {tab === "holdings" ? "holdings" : "SIP plans"} yet — add your first one {isDesktop ? "on the right" : "below"}.</div>}
    {items.map((item) => <div key={item.id}>
      <div style={{ ...ROW, borderRadius: 10, padding: "11px 10px", borderBottom: "none", background: editing?.id === item.id ? "var(--c-accent-bg)" : "var(--c-faint)" }}>
        <span style={{ flex: 1, minWidth: 0 }}>{item.name}<small style={SUB}>{tab === "holdings" ? `₹${Number((item as Holding).current_value).toLocaleString("en-IN")} · ${(item as Holding).kind === "fd" ? "Fixed deposit" : "Mutual fund"}` : `₹${Number((item as Sip).monthly).toLocaleString("en-IN")} monthly`}</small></span>
        <button onClick={() => tab === "holdings" ? editHolding(item as Holding) : editSip(item as Sip)} style={{ ...action, ...(editing?.id === item.id ? { border: "1px solid var(--c-accent-4)", color: "var(--c-accent-2)" } : {}) }}>Edit</button>
        <button onClick={() => remove(item.id)} style={{ ...action, color: "#b91c1c" }}>Delete</button>
      </div>
      {inlineEdit && editing?.id === item.id && <div style={editCard}>{formFields(true)}</div>}
    </div>)}
  </div>;

  // Shimmer placeholder list — replaces the empty-then-populated flash on open.
  const skeletonRows = <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ ...ROW, borderBottom: "none", padding: "11px 10px", gap: 10 }}>
      <div style={{ flex: 1 }}><Skeleton width={`${52 + ((i * 11) % 34)}%`} height={13} radius={6} /><Skeleton width="38%" height={10} radius={5} style={{ marginTop: 7 }} /></div>
      <Skeleton width={52} height={30} radius={9} /><Skeleton width={62} height={30} radius={9} />
    </div>)}
  </div>;

  return <Overlay onClose={onClose} desktopWidth={860}><div style={{ ...CARD, maxHeight: "88vh", overflowY: "auto" }}>
    <div style={HEADER}><div><div style={TITLE}>Manage portfolio</div><div style={SUB}>Add, edit, or remove holdings and SIP plans</div></div><button onClick={onClose} style={CLOSE}>✕</button></div>
    <div style={{ display: "flex", gap: 5, padding: 4, background: "var(--c-field)", borderRadius: 12, marginBottom: 16 }}>{(["holdings", "sips", "total"] as Tab[]).map((item) => <button key={item} onClick={() => { setTab(item); reset(); }} style={{ ...action, flex: 1, border: "none", background: tab === item ? "var(--c-surface)" : "transparent", color: tab === item ? "var(--c-ink)" : "var(--c-muted)" }}>{item === "total" ? "Value" : item === "sips" ? "SIPs" : "Holdings"}</button>)}</div>
    {tab === "total" ? <div><label style={SUB}>Portfolio value</label>{loading ? <Skeleton height={40} radius={10} style={{ marginTop: 6 }} /> : <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} style={{ ...input, marginTop: 6 }} />}<button onClick={saveTotal} disabled={saving || loading} style={{ ...SAVE, marginTop: 14, opacity: saving || loading ? .55 : 1 }}>{saving ? "Saving…" : "Save portfolio value"}</button></div>
    : isDesktop ? <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)", gap: 20, alignItems: "start" }}>
        <div className="subtle-scroll" style={{ maxHeight: "58vh", overflowY: "auto", paddingRight: 2 }}>{loading ? skeletonRows : rows(false)}</div>
        <div style={{ position: "sticky", top: 0 }}><div style={panel}>{formFields(!!editing)}</div></div>
      </div>
    : <>
        {loading ? skeletonRows : rows(true)}
        {!loading && !editing && <div style={{ borderTop: "1px solid var(--c-field)", paddingTop: 15, marginTop: 6 }}>{formFields(false)}</div>}
      </>}
  </div></Overlay>;
}
