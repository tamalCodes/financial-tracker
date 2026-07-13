"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BODY, DISPLAY, type Category, type CategoryKey } from "./data";
import AmountField, {
  OperatorBar,
  type AmountFieldHandle,
} from "./AmountField";
import CatPill from "./CatPill";

// EditSheet — tap a recent payment to edit it. Same visual language as AddSheet:
// a bottom sheet on mobile that becomes a centered dialog on desktop (≥1024px),
// glassy overlay — but pre-filled and PUTs instead of POSTs.
// Fields: amount (shared calculator field), title, a single free-form tag chip,
// and category (shared slim pills).
interface Props {
  amount: string;
  title: string;
  tag: string;
  cat: CategoryKey;
  cats: Category[];
  saving?: boolean;
  deleting?: boolean;
  onAmount: (v: string) => void;
  onTitle: (v: string) => void;
  onTag: (v: string) => void;
  onCat: (key: CategoryKey) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const FIELD_LABEL: React.CSSProperties = {
  font: `500 13px ${BODY}`,
  color: "var(--c-body)",
};

// Tag as a chip: an "+ Add tag" pill when empty, an editable indigo chip once set.
// Tapping either drops into a compact inline input; blur/Enter commits.
function TagField({
  tag,
  onTag,
}: {
  tag: string;
  onTag: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tag);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function open() {
    setDraft(tag);
    setEditing(true);
  }
  function commit() {
    onTag(draft.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          maxLength={32}
          placeholder="Type a tag…"
          style={{
            width: "100%",
            border: "1px solid var(--c-accent-3)",
            borderRadius: 10,
            padding: "0 15px",
            height: 40,
            fontFamily: BODY,
            fontSize: 15,
            color: "var(--c-ink)",
            background: "var(--c-faint)",
            outline: "none",
          }}
        />
      </div>
    );
  }

  if (tag) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span
          onClick={open}
          style={{
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 30,
            padding: "0 6px 0 12px",
            borderRadius: 10,
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 13,
            lineHeight: 1,
            color: "var(--c-accent)",
            background:
              "linear-gradient(135deg,rgb(var(--c-accent-rgb) / 0.20),rgb(var(--c-accent-rgb) / 0.10))",
            border: "1px solid rgb(var(--c-accent-rgb) / 0.45)",
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTag("");
            }}
            aria-label="Remove tag"
            style={{
              cursor: "pointer",
              width: 20,
              height: 20,
              borderRadius: 7,
              border: "none",
              background: "rgb(var(--c-accent-rgb) / 0.15)",
              color: "var(--c-accent)",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      style={{
        cursor: "pointer",
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 30,
        padding: "0 13px 0 10px",
        borderRadius: 10,
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: 13,
        lineHeight: 1,
        color: "var(--c-body-2)",
        background: "var(--c-surface)",
        border: "1px dashed var(--c-line-strong)",
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1, marginTop: -1 }}>+</span>
      Add tag
    </button>
  );
}

export default function EditSheet({
  amount,
  title,
  tag,
  cat,
  cats,
  saving,
  deleting,
  onAmount,
  onTitle,
  onTag,
  onCat,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [titleFocus, setTitleFocus] = useState(false);
  const [calcActive, setCalcActive] = useState(false);
  const saveDisabled = saving || calcActive;
  // Amount focused on touch → CTA slot becomes the glassy operator bar (see AddSheet).
  const amountRef = useRef<AmountFieldHandle>(null);
  const [amountFocus, setAmountFocus] = useState(false);
  const [touch] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)").matches ?? false)
  );
  const showOps = touch && amountFocus;

  // Desktop (≥1024px): render as a centered dialog card — full radius, no
  // bottom-sheet grabber. Below that, keep the mobile bottom sheet. Mirrors AddSheet.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(20,16,10,0.62)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: isDesktop ? "center" : "flex-end",
        justifyContent: "center",
        padding: isDesktop ? 24 : 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "100%",
          maxHeight: isDesktop ? "calc(100vh - 48px)" : undefined,
          overflowY: isDesktop ? "auto" : undefined,
          background: "var(--c-surface)",
          border: "1px solid var(--c-line-strong)",
          borderRadius: isDesktop ? 24 : "30px 30px 0 0",
          boxShadow: isDesktop
            ? "0 24px 80px -12px rgba(0,0,0,0.65)"
            : "0 -18px 60px -18px rgba(32,27,19,0.45)",
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            padding: "10px 22px calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          {/* Grabber (mobile bottom-sheet affordance only) */}
          <div style={{ display: isDesktop ? "none" : "flex", justifyContent: "center", padding: "4px 0 16px" }}>
            <span style={{ width: 42, height: 5, borderRadius: 999, background: "var(--c-line)" }} />
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, letterSpacing: "-0.01em", color: "var(--c-ink)" }}>
              Edit payment
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                cursor: "pointer",
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "1px solid var(--c-line)",
                background: "var(--c-faint)",
                color: "var(--c-body-2)",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Amount — shared calculator field, ₹ prefixed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            <span style={FIELD_LABEL}>Amount</span>
            <AmountField
              ref={amountRef}
              amount={amount}
              onAmount={onAmount}
              placeholder="0"
              prefix="₹"
              onCalcActiveChange={setCalcActive}
              onFocusChange={setAmountFocus}
            />
          </div>

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            <span style={FIELD_LABEL}>Title</span>
            <input
              value={title}
              onChange={(e) => onTitle(e.target.value)}
              onFocus={() => setTitleFocus(true)}
              onBlur={() => setTitleFocus(false)}
              placeholder="What was this for?"
              style={{
                width: "100%",
                border: `1px solid ${titleFocus ? "var(--c-accent-3)" : "var(--c-line)"}`,
                borderRadius: 14,
                padding: "0 15px",
                height: 50,
                fontFamily: BODY,
                fontSize: 16,
                color: "var(--c-ink)",
                background: "var(--c-faint)",
                outline: "none",
              }}
            />
          </div>

          {/* Category */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
            <span style={FIELD_LABEL}>Category</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cats.map((c) => (
                <CatPill key={c.key} cat={c} selected={c.key === cat} onSelect={() => onCat(c.key)} />
              ))}
            </div>
          </div>

          {/* Tag — chip / "+ Add tag" pill */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
            <span style={FIELD_LABEL}>Tag</span>
            <TagField tag={tag} onTag={onTag} />
          </div>

          {/* Save — or the glassy operator bar while the Amount field is focused */}
          {showOps ? (
            <OperatorBar onOp={(op) => amountRef.current?.insertOp(op)} />
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled}
              style={{
                cursor: saveDisabled ? "default" : "pointer",
                width: "100%",
                height: 54,
                border: "none",
                borderRadius: 16,
                background: "var(--c-cta)",
                color: "var(--c-cta-fg)",
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 15.5,
                opacity: saveDisabled ? 0.6 : 1,
                boxShadow: "0 8px 20px -8px rgba(32,27,19,0.28)",
                transition: "opacity .25s ease",
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            style={{
              cursor: deleting ? "default" : "pointer",
              width: "100%",
              height: 48,
              marginTop: 10,
              borderRadius: 16,
              border: "1px solid var(--c-line)",
              background: "var(--c-surface)",
              color: "var(--c-expense)",
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 14.5,
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? "Deleting…" : "Delete payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
