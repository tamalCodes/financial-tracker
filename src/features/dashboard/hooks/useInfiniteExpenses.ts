"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Expense } from "@/features/dashboard/types/types";
import type { TxView } from "@/features/dashboard/mobile/useFinance";
import { catOf, fmt, type CategoryKey } from "@/features/dashboard/mobile/data";
import { formatTxnDate } from "@/features/dashboard/utils/dates";

const PAGE_SIZE = 12; // desktop scroll batch (larger than the mobile pager's 6)

const toTxView = (e: Expense): TxView => {
  const c = catOf(e.category as CategoryKey);
  return {
    id: e.id,
    merchant: e.description,
    category: c.label,
    categoryKey: e.category as CategoryKey,
    tag: e.tag ?? null,
    date: e.created_at ? formatTxnDate(e.created_at) : "",
    amount: fmt(Number(e.amount)),
    rawAmount: Number(e.amount),
    rgb: c.rgb,
    text: c.text,
  };
};

/**
 * Desktop "Recent payments" as a scroll-paginated list: fetches page 1, then appends
 * further pages via loadMore() as the card scrolls near its bottom. Replaces the mobile
 * Prev/Next pager on desktop (specs/features/desktop-dashboard.md). Resets on month
 * change. `reloadToken` (bump it) forces a fresh reload after an add/edit/delete.
 */
export const useInfiniteExpenses = (currentMonth: string, reloadToken = 0) => {
  const [rows, setRows] = useState<TxView[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true); // initial page
  const [loadingMore, setLoadingMore] = useState(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPage = useCallback(
    async (p: number) => {
      const res = await fetch(
        `/api/expenses?month=${currentMonth}&page=${p}&pageSize=${PAGE_SIZE}`
      );
      if (!res.ok) throw new Error("expenses page load failed");
      const data = (await res.json()) as { items: Expense[] };
      return (data.items ?? []).map(toTxView);
    },
    [currentMonth]
  );

  // Load / reload page 1 on month change or reload bump. The fetch lives in a
  // useCallback (not the effect body) so status setState lands in the async callback —
  // the accepted data-load pattern in this repo (useDashboardData).
  const reload = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const items = await fetchPage(1);
      if (isMountedRef.current) {
        setRows(items);
        setHasMore(items.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error(err);
      if (isMountedRef.current) {
        setRows([]);
        setHasMore(false);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    reload();
  }, [reload, reloadToken]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    fetchPage(next)
      .then((items) => {
        if (!isMountedRef.current) return;
        setRows((prev) => [...prev, ...items]);
        setPage(next);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch((err) => {
        console.error(err);
        if (isMountedRef.current) setHasMore(false);
      })
      .finally(() => {
        if (isMountedRef.current) setLoadingMore(false);
      });
  }, [fetchPage, page, hasMore, loading, loadingMore]);

  return { rows, loading, loadingMore, hasMore, loadMore };
};
