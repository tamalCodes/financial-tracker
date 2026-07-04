"use client";

import { useEffect, useRef, useState } from "react";
import { BODY, DISPLAY, type Category, type CategoryKey } from "./data";
import AmountField from "./AmountField";
import CatPill from "./CatPill";

// EditSheet — tap a recent payment to edit it. Same visual language as AddSheet
// (bottom sheet, glassy overlay), but pre-filled and PUTs instead of POSTs.
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
  color: "#475569",
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
            border: "1px solid #818cf8",
            borderRadius: 10,
            padding: "0 15px",
            height: 40,
            fontFamily: BODY,
            fontSize: 15,
            color: "#0f172a",
            background: "#f8fafc",
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
            color: "#4338ca",
            background:
              "linear-gradient(135deg,rgba(99,102,241,0.20),rgba(99,102,241,0.10))",
            border: "1px solid rgba(99,102,241,0.45)",
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
              background: "rgba(99,102,241,0.15)",
              color: "#4338ca",
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
        color: "#64748b",
        background: "#fff",
        border: "1px dashed #cbd5e1",
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

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15,23,42,0.40)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: "30px 30px 0 0",
          boxShadow: "0 -18px 60px -18px rgba(15,23,42,0.45)",
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            padding: "10px 22px calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          {/* Grabber */}
          <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 16px" }}>
            <span style={{ width: 42, height: 5, borderRadius: 999, background: "#e2e8f0" }} />
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, letterSpacing: "-0.01em", color: "#0f172a" }}>
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
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#64748b",
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
              amount={amount}
              onAmount={onAmount}
              placeholder="0"
              prefix="₹"
              onCalcActiveChange={setCalcActive}
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
                border: `1px solid ${titleFocus ? "#818cf8" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: "0 15px",
                height: 50,
                fontFamily: BODY,
                fontSize: 16,
                color: "#0f172a",
                background: "#f8fafc",
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

          {/* Save */}
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
              background: "#4f46e5",
              color: "#fff",
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 15.5,
              opacity: saveDisabled ? 0.6 : 1,
              boxShadow: "0 8px 20px -8px rgba(79,70,229,0.55)",
              transition: "opacity .25s ease",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>

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
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#b91c1c",
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
