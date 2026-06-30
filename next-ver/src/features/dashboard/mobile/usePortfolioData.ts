"use client";

import { useEffect, useState } from "react";
import { fmt, type Fd, type Fund, type SipRow } from "./data";

interface Holding {
  id: string;
  kind: "fd" | "mutual_fund";
  name: string;
  current_value: number;
  rate: number | null;
  maturity_date: string | null;
}
interface Sip {
  id: string;
  name: string;
  monthly: number;
  due_date: string | null;
  paid_total: number;
}

// Investments panel data — separate from the dashboard payload, fetched on mount
// (checklist §2.5). Holdings split by kind: fd → Fixed Deposits, mutual_fund → Mutual Funds.
export function usePortfolioData() {
  const [portfolioTotal, setPortfolioTotal] = useState("0");
  const [fds, setFds] = useState<Fd[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [sips, setSips] = useState<SipRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pRes, hRes, sRes] = await Promise.all([
          fetch("/api/portfolio"),
          fetch("/api/holdings"),
          fetch("/api/sips"),
        ]);
        const p = pRes.ok ? ((await pRes.json()) as { value: number }) : { value: 0 };
        const h = hRes.ok ? ((await hRes.json()) as { items: Holding[] }) : { items: [] };
        const s = sRes.ok ? ((await sRes.json()) as { items: Sip[] }) : { items: [] };
        if (!alive) return;

        setPortfolioTotal(fmt(Number(p.value ?? 0)));
        setFds(
          h.items
            .filter((x) => x.kind === "fd")
            .map((x) => ({
              name: x.name,
              // D-D: maturity only, no "% p.a."
              sub: x.maturity_date ? `matures ${x.maturity_date}` : "",
              amount: fmt(Number(x.current_value)),
            }))
        );
        setFunds(
          h.items
            .filter((x) => x.kind === "mutual_fund")
            .map((x) => ({ name: x.name, current: fmt(Number(x.current_value)) }))
        );
        setSips(
          s.items.map((x) => ({
            name: x.name,
            monthly: fmt(Number(x.monthly)),
            due: x.due_date ?? "",
            paid: fmt(Number(x.paid_total)),
          }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { portfolioTotal, fds, funds, sips, loading };
}
