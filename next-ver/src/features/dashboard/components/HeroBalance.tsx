"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

// "Left in bank" hero (mobile handoff §5.1): cumulative balance + month stepper +
// three per-month glass stat tiles (Earned / Spent / Invested).
interface HeroBalanceProps {
  net: number; // cumulative "Left in bank"
  monthLabel: string;
  earned: number;
  spent: number;
  invested: number;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const fmtAbs = (n: number) =>
  new Intl.NumberFormat("en-IN").format(Math.round(Math.abs(n)));

const Rupee = ({ n }: { n: number }) => (
  <>
    {n < 0 ? "-₹" : "₹"}
    {fmtAbs(n)}
  </>
);

interface TileProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  labelColor: string;
  valueColor: string;
}

function Tile({ label, value, icon, gradient, border, labelColor, valueColor }: TileProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-[18px] p-[13px_12px]"
      style={{
        background: gradient,
        border: `1px solid ${border}`,
        backdropFilter: "blur(14px) saturate(1.7)",
        WebkitBackdropFilter: "blur(14px) saturate(1.7)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <span
        className="font-heading inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
        style={{ color: labelColor }}
      >
        {icon}
        {label}
      </span>
      <span
        className="font-heading text-[16.5px] font-semibold -tracking-[0.02em] tabular-nums"
        style={{ color: valueColor }}
      >
        <Rupee n={value} />
      </span>
    </div>
  );
}

export default function HeroBalance({
  net,
  monthLabel,
  earned,
  spent,
  invested,
  canNext,
  onPrev,
  onNext,
}: HeroBalanceProps) {
  return (
    <div
      className="flex flex-col gap-[14px] rounded-[26px] border border-slate-200 bg-white p-[18px]"
      style={{
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)",
      }}
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className="font-body text-[13px] font-medium text-slate-500">
          Left in bank
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous month"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-600"
          >
            <ChevronLeft className="h-[15px] w-[15px]" strokeWidth={2} />
          </button>
          <span className="font-heading min-w-[78px] whitespace-nowrap text-center text-[13px] font-semibold text-slate-700">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Next month"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-600 disabled:opacity-40"
          >
            <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2} />
          </button>
        </div>
      </div>

      <span className="font-heading text-[36px] font-semibold leading-none -tracking-[0.03em] text-slate-900 tabular-nums">
        <Rupee n={net} />
      </span>

      <div className="mt-0.5 grid grid-cols-3 gap-2.5">
        <Tile
          label="Earned"
          value={earned}
          icon={<ArrowUp className="h-[13px] w-[13px]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, rgba(16,185,129,0.30), rgba(16,185,129,0.15))"
          border="rgba(16,185,129,0.45)"
          labelColor="#047857"
          valueColor="#065f46"
        />
        <Tile
          label="Spent"
          value={spent}
          icon={<ArrowDown className="h-[13px] w-[13px]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, rgba(239,68,68,0.26), rgba(239,68,68,0.13))"
          border="rgba(239,68,68,0.42)"
          labelColor="#b91c1c"
          valueColor="#991b1b"
        />
        <Tile
          label="Invested"
          value={invested}
          icon={<TrendingUp className="h-[13px] w-[13px]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, rgba(139,92,246,0.26), rgba(139,92,246,0.13))"
          border="rgba(139,92,246,0.42)"
          labelColor="#6d28d9"
          valueColor="#5b21b6"
        />
      </div>
    </div>
  );
}
