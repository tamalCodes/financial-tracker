"use client";

import { DISPLAY, type Category } from "./data";

// CatPill — slim category chip shared by AddSheet and EditSheet. Selected = glassy
// tint in the category colour; unselected = flat white outline with a grey dot.
export default function CatPill({
  cat,
  selected,
  onSelect,
}: {
  cat: Category;
  selected: boolean;
  onSelect: () => void;
}) {
  const base: React.CSSProperties = {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    height: 30,
    padding: "0 13px",
    borderRadius: 10,
    fontFamily: DISPLAY,
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1,
  };
  const style: React.CSSProperties = selected
    ? {
        ...base,
        color: cat.text,
        background: `linear-gradient(135deg,rgba(${cat.rgb},0.30),rgba(${cat.rgb},0.15))`,
        border: `1px solid rgba(${cat.rgb},0.50)`,
      }
    : {
        ...base,
        color: "#64748b",
        background: "#fff",
        border: "1px solid #e2e8f0",
      };
  return (
    <button type="button" onClick={onSelect} style={style}>
      <span
        style={{
          display: "block",
          flexShrink: 0,
          width: 8,
          height: 8,
          borderRadius: 999,
          background: selected ? cat.text : "#cbd5e1",
        }}
      />
      {cat.label}
    </button>
  );
}
