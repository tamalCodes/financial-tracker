"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrendPoint } from "@/lib/api/trend";

export type TrendWindow = 6 | 12;

interface TrendState {
  series: TrendPoint[];
  loading: boolean;
  error: boolean;
  window: TrendWindow;
  setWindow: (w: TrendWindow) => void;
}

/**
 * Fetches the Earned/Spent/Invested trend for the desktop chart. Owns the 6/12
 * window toggle; refetches on window or anchor-month change. Anchor is the month
 * the dashboard is currently viewing (useFinance.currentMonth). The fetch lives in a
 * useCallback (not the effect body) so status setState lands in the async callback —
 * the accepted data-load pattern in this repo (useDashboardData).
 */
export const useTrendData = (currentMonth: string): TrendState => {
  const [window, setWindow] = useState<TrendWindow>(6);
  const [series, setSeries] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/trend?month=${currentMonth}&months=${window}`);
      if (!res.ok) throw new Error("trend load failed");
      const data = (await res.json()) as { series: TrendPoint[] };
      if (isMountedRef.current) setSeries(data.series ?? []);
    } catch (err) {
      console.error(err);
      if (isMountedRef.current) {
        setSeries([]);
        setError(true);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [currentMonth, window]);

  useEffect(() => {
    load();
  }, [load]);

  return { series, loading, error, window, setWindow };
};
