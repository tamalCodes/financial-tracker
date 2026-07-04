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
        // One request instead of three (portfolio + holdings + sips) — see
        // /api/portfolio-panel. Cuts the mobile home's initial fan-out.
        const res = await fetch("/api/portfolio-panel");
        const data = res.ok
          ? ((await res.json()) as {
              value: number;
              holdings: Holding[];
              sips: Sip[];
            })
          : { value: 0, holdings: [], sips: [] };
        if (!alive) return;

        setPortfolioTotal(fmt(Number(data.value ?? 0)));
        setFds(
          (data.holdings ?? [])
            .filter((x) => x.kind === "fd")
            .map((x) => ({
              name: x.name,
              // D-D: maturity only, no "% p.a."
              sub: x.maturity_date ? `matures ${x.maturity_date}` : "",
              amount: fmt(Number(x.current_value)),
            }))
        );
        setFunds(
          (data.holdings ?? [])
            .filter((x) => x.kind === "mutual_fund")
            .map((x) => ({ name: x.name, current: fmt(Number(x.current_value)) }))
        );
        setSips(
          (data.sips ?? []).map((x) => ({
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
