"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** Quick-pick labels shown beneath the field when not already added. */
  suggestions?: string[];
  max?: number;
}

const DEFAULT_SUGGESTIONS = ["Food", "Bills", "Shopping"];

/**
 * Per-tag GLASS treatment (glassmorphism — see DESIGN_SYSTEM.md "Glass"): a
 * translucent hue tint + frost (backdrop-blur) + translucent border + top sheen,
 * with deep-family text (≥4.5:1 on the pale tint over white). `rgb` is the hue's
 * 0-255 triple; `text` is its deep shade. Unknown/custom tags fall back to slate.
 */
const TAG_GLASS: Record<string, { rgb: string; text: string }> = {
  food: { rgb: "234 88 12", text: "#9a3412" }, // orange
  bills: { rgb: "37 99 235", text: "#1e40af" }, // blue
  shopping: { rgb: "219 39 119", text: "#9d174d" }, // pink
};
const FALLBACK_GLASS = { rgb: "71 85 105", text: "#334155" }; // slate

const glassTagStyle = (tag: string): React.CSSProperties => {
  const c = TAG_GLASS[tag.toLowerCase()] ?? FALLBACK_GLASS;
  return {
    color: c.text,
    backgroundImage: `linear-gradient(135deg, rgb(${c.rgb} / 0.30) 0%, rgb(${c.rgb} / 0.15) 100%)`,
    border: `1px solid rgb(${c.rgb} / 0.45)`,
    backdropFilter: "blur(14px) saturate(1.7)",
    WebkitBackdropFilter: "blur(14px) saturate(1.7)",
    boxShadow:
      "inset 0 1px 0 0 rgb(255 255 255 / 0.6), 0 1px 2px 0 rgb(15 23 42 / 0.06)",
  };
};

/**
 * Chip-style tag entry. Type a label and press Enter (or comma) to commit it;
 * Backspace on an empty field removes the last chip. Tags are trimmed and
 * deduped case-insensitively. Quiet quick-pick row offers common labels.
 */
export default function TagInput({
  id,
  value,
  onChange,
  placeholder = "Add a tag…",
  suggestions = DEFAULT_SUGGESTIONS,
  max = 12,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.length >= max) return;
    const exists = value.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (!exists) onChange([...value, tag]);
    setDraft("");
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  const open = suggestions.filter(
    (s) => !value.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-field px-3 py-2.5 transition-colors focus-within:border-faint focus-within:bg-surface">
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            style={glassTagStyle(tag)}
            className="inline-flex items-center gap-1 rounded-pill py-1 pl-3 pr-1.5 text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${tag}`}
              className="grid h-4 w-4 place-items-center rounded-pill text-current opacity-60 transition hover:bg-black/10 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[6rem] flex-1 bg-transparent py-1 text-base outline-none placeholder:text-faint"
        />
      </div>

      {open.length > 0 && value.length < max && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {open.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              style={glassTagStyle(s)}
              className="rounded-pill px-3 py-1 text-sm font-medium transition hover:brightness-105"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
