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

const DEFAULT_SUGGESTIONS = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Subscription",
];

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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors focus-within:border-slate-400 focus-within:bg-white">
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pl-3 pr-1.5 text-sm font-medium text-indigo-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${tag}`}
              className="grid h-4 w-4 place-items-center rounded-full text-indigo-400 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
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
          className="min-w-[6rem] flex-1 bg-transparent py-1 text-base outline-none placeholder:text-slate-400"
        />
      </div>

      {open.length > 0 && value.length < max && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {open.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
