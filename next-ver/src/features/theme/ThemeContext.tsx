"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Theme system for the whole app. Components read colors via CSS var(--c-*) tokens
// (src/app/globals.css); this provider only toggles the `dark` class on <html>, which
// flips those tokens. Preference: explicit user choice (localStorage) → OS setting.
// Anti-flash: the resolved theme class is set by an inline <script> in the root layout
// BEFORE React hydrates (see ThemeScript), so there's no light→dark flicker on load.

type ThemeChoice = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "ft-theme";

interface ThemeCtx {
  /** User's stored preference (may be "system"). */
  choice: ThemeChoice;
  /** Actual applied theme after resolving "system". */
  resolved: Resolved;
  /** Flip between light/dark (collapses "system" to an explicit choice). */
  toggle: () => void;
  setChoice: (c: ThemeChoice) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStored(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function applyResolved(resolved: Resolved) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy init reads storage/OS on the client (guards return SSR-safe defaults on the
  // server). The DOM class is already correct pre-paint via THEME_SCRIPT, and <html>
  // has suppressHydrationWarning, so no visible mismatch.
  const [choice, setChoiceState] = useState<ThemeChoice>(readStored);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Keep `systemDark` synced with the OS setting (only matters while choice==="system").
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: Resolved =
    choice === "system" ? (systemDark ? "dark" : "light") : choice;

  // Keep the DOM class in sync whenever the resolved theme changes.
  useEffect(() => {
    applyResolved(resolved);
  }, [resolved]);

  const setChoice = useCallback((c: ThemeChoice) => {
    setChoiceState(c);
    if (c === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const toggle = useCallback(() => {
    setChoice(resolved === "dark" ? "light" : "dark");
  }, [resolved, setChoice]);

  const value = useMemo(
    () => ({ choice, resolved, toggle, setChoice }),
    [choice, resolved, toggle, setChoice],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Inline, blocking script injected in <head> to set the theme class before paint.
// Mirrors the resolution logic above (stored choice → OS). Keep in sync with readStored.
export const THEME_SCRIPT = `
(function(){
  try {
    var c = localStorage.getItem('${STORAGE_KEY}');
    var dark = c === 'dark' || (c !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
