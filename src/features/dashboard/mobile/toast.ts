"use client";

// Tiny module-level toast store. No context/provider plumbing — any code (hooks,
// mutations in useFinance) can call `toast()` directly, and <Toaster /> subscribes
// to render. Keeps the leaf components untouched, mirroring the useFinance approach.

import { useSyncExternalStore } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

const AUTO_DISMISS_MS = 3200;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  // New array identity so useSyncExternalStore sees the change.
  toasts = [...toasts];
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

// Stable empty snapshot for SSR (must be referentially stable across calls).
const SERVER_SNAPSHOT: Toast[] = [];
function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function dismissToast(id: number) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
  toasts = toasts.filter((x) => x.id !== id);
  emit();
}

// Fire a toast. Returns the id so callers can dismiss early if needed.
export function toast(message: string, variant: ToastVariant = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  timers.set(
    id,
    setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
  );
  emit();
  return id;
}

// Convenience helpers so call sites read clean.
toast.success = (m: string) => toast(m, "success");
toast.error = (m: string) => toast(m, "error");
toast.info = (m: string) => toast(m, "info");

// Subscribe to the live toast list. Used by <Toaster />.
export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
