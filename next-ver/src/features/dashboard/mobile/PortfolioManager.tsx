"use client";

import { useEffect, useRef, useState } from "react";
import { BODY, DISPLAY } from "./data";
import AmountField, { OperatorBar, type AmountFieldHandle } from "./AmountField";
import { CARD, CLOSE, HEADER, Overlay, ROW, SAVE, SUB, TITLE } from "./SipPaymentSheet";
import { toast } from "./toast";

type Holding = { id: string; kind: "fd" | "mutual_fund"; name: string; current_value: number; rate: number | null; maturity_date: string | null };
type Sip = { id: string; name: string; monthly: number; due_date: string | null; paid_total: number };
type Tab = "holdings" | "sips" | "total";

const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid var(--c-line)", borderRadius: 10, padding: "10px 11px", background: "var(--c-faint)", color: "var(--c-ink)", font: `500 13px ${BODY}` };
const action: React.CSSProperties = { cursor: "pointer", border: "1px solid var(--c-line)", borderRadius: 9, background: "var(--c-faint)", color: "var(--c-body-2)", padding: "7px 9px", font: `600 11px ${DISPLAY}` };
const typeButton: React.CSSProperties = { cursor: "pointer", flex: 1, border: "1px solid var(--c-line)", borderRadius: 10, padding: "9px 10px", background: "var(--c-faint)", color: "var(--c-muted)", font: `600 12px ${DISPLAY}` };

export default function PortfolioManager({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> | void }) {
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
  useEffect(() => { load().catch((e) => toast.error(e.message)); }, []);
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
  const form = (isEdit: boolean) => <div style={isEdit ? { padding: "12px", margin: "0 0 8px", border: "1px solid var(--c-accent-4)", borderRadius: 14, background: "var(--c-accent-bg)" } : { borderTop: "1px solid var(--c-field)", paddingTop: 15 }}>
    <b style={{ font: `600 14px ${DISPLAY}`, color: "var(--c-ink)" }}>{isEdit ? "Edit" : "Add"} {tab === "holdings" ? "holding" : "SIP"}</b>
    {tab === "holdings" && <div role="group" aria-label="Holding type" style={{ display: "flex", gap: 8, marginTop: 10 }}>
      {([['mutual_fund', 'Mutual fund'], ['fd', 'Fixed deposit']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} style={{ ...typeButton, ...(kind === value ? { borderColor: "var(--c-accent-4)", background: "var(--c-accent-bg)", color: "var(--c-accent-2)", boxShadow: "inset 0 0 0 1px var(--c-accent-4)" } : {}) }}>{label}</button>)}
    </div>}
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tab === "holdings" ? "Fund or FD name" : "Fund name"} style={{ ...input, marginTop: 10 }} />
    <div style={{ marginTop: 10 }}><AmountField ref={amountRef} amount={amount} onAmount={setAmount} prefix="₹" placeholder="Try 49,986 + 500" onCalcActiveChange={setCalcActive} onFocusChange={setAmountFocus} /></div>
    {amountFocus && <div style={{ marginTop: 8 }}><OperatorBar onOp={(op) => amountRef.current?.insertOp(op)} /></div>}
    <input value={due} onChange={(e) => setDue(e.target.value)} placeholder={tab === "holdings" && kind === "fd" ? "Maturity date (optional)" : "Due date (optional)"} style={{ ...input, marginTop: 10 }} />
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button onClick={save} disabled={saving || calcActive} style={{ ...SAVE, flex: 1, opacity: saving || calcActive ? .55 : 1 }}>{saving ? "Saving…" : isEdit ? "Save changes" : "Add"}</button>{isEdit && <button onClick={reset} style={action}>Cancel</button>}</div>
  </div>;
  return <Overlay onClose={onClose}><div style={{ ...CARD, maxHeight: "88vh", overflowY: "auto" }}>
    <div style={HEADER}><div><div style={TITLE}>Manage portfolio</div><div style={SUB}>Add, edit, or remove holdings and SIP plans</div></div><button onClick={onClose} style={CLOSE}>✕</button></div>
    <div style={{ display: "flex", gap: 5, padding: 4, background: "var(--c-field)", borderRadius: 12, marginBottom: 16 }}>{(["holdings", "sips", "total"] as Tab[]).map((item) => <button key={item} onClick={() => { setTab(item); reset(); }} style={{ ...action, flex: 1, border: "none", background: tab === item ? "var(--c-surface)" : "transparent", color: tab === item ? "var(--c-ink)" : "var(--c-muted)" }}>{item === "total" ? "Value" : item === "sips" ? "SIPs" : "Holdings"}</button>)}</div>
    {tab === "total" ? <div><label style={SUB}>Portfolio value</label><input type="number" value={total} onChange={(e) => setTotal(e.target.value)} style={{ ...input, marginTop: 6 }} /><button onClick={saveTotal} disabled={saving} style={{ ...SAVE, marginTop: 14 }}>{saving ? "Saving…" : "Save portfolio value"}</button></div> : <>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 16 }}>{(tab === "holdings" ? holdings : sips).map((item) => <div key={item.id}><div style={{ ...ROW, background: editing?.id === item.id ? "var(--c-accent-bg)" : undefined }}><span style={{ flex: 1, minWidth: 0 }}>{item.name}<small style={SUB}>{tab === "holdings" ? `₹${Number((item as Holding).current_value).toLocaleString("en-IN")} · ${(item as Holding).kind === "fd" ? "Fixed deposit" : "Mutual fund"}` : `₹${Number((item as Sip).monthly).toLocaleString("en-IN")} monthly`}</small></span><button onClick={() => tab === "holdings" ? editHolding(item as Holding) : editSip(item as Sip)} style={action}>Edit</button><button onClick={() => remove(item.id)} style={{ ...action, color: "#b91c1c" }}>Delete</button></div>{editing?.id === item.id && form(true)}</div>)}</div>
      {!editing && form(false)}
    </>}</div></Overlay>;
}
