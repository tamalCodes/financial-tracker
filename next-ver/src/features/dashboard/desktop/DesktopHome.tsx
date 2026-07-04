"use client";

import { useMemo } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useFinance } from "@/features/dashboard/mobile/useFinance";
import { usePortfolioData } from "@/features/dashboard/mobile/usePortfolioData";
import { useTrendData } from "@/features/dashboard/hooks/useTrendData";
import { BODY, DISPLAY } from "@/features/dashboard/mobile/data";
import HeroBalance from "@/features/dashboard/mobile/HeroBalance";
import Transactions from "@/features/dashboard/mobile/Transactions";
import Income from "@/features/dashboard/mobile/Income";
import Bills from "@/features/dashboard/mobile/Bills";
import Emis from "@/features/dashboard/mobile/Emis";
import Investments from "@/features/dashboard/mobile/Investments";
import AddSheet from "@/features/dashboard/mobile/AddSheet";
import EditSheet from "@/features/dashboard/mobile/EditSheet";
import BillEditSheet from "@/features/dashboard/mobile/BillEditSheet";
import Toaster from "@/features/dashboard/mobile/Toaster";
import { useInfiniteExpenses } from "@/features/dashboard/hooks/useInfiniteExpenses";
import TrendChart from "./TrendChart";

// Identity for the greeting — mirrors MobileHome (derive name/initials from the email).
function identityFrom(email: string | null | undefined) {
  const local = (email ?? "").split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const name = parts.length
    ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
    : "there";
  const initials =
    (parts.map((p) => p.charAt(0).toUpperCase()).join("").slice(0, 2)) || "U";
  return { name, initials };
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const INDIGO_PILL = "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(99,102,241,0.09))";
const INDIGO_AVATAR = "linear-gradient(135deg,rgba(99,102,241,0.30),rgba(99,102,241,0.16))";
const INDIGO_BADGE = "linear-gradient(135deg,rgba(99,102,241,0.30),rgba(99,102,241,0.16))";

// Desktop / tablet-landscape home. Reuses the same data hooks and cards as MobileHome
// (specs/features/desktop-dashboard.md), reflowed into a two-column dashboard with a
// monthly-trend chart. Rendered by Dashboard.tsx when the viewport is ≥ 1024px.
export default function DesktopHome() {
  const { user } = useAuth();
  const f = useFinance();
  const portfolio = usePortfolioData();
  const trend = useTrendData(f.currentMonth);
  // Desktop "Recent payments" scrolls + appends instead of paging. Reload the list
  // when the month changes (handled inside) or the expense count shifts (add/delete).
  const tx = useInfiniteExpenses(f.currentMonth, f.derived.count);

  const { name, initials } = useMemo(() => identityFrom(user?.email), [user?.email]);
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "radial-gradient(1200px 700px at 50% -200px,#eef2f7,#e3e8ef)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 32px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1360,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Header — "Overview" (handoff desktop block) */}
        <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: INDIGO_BADGE,
                border: "1px solid rgba(99,102,241,0.45)",
              }}
            >
              <svg width="21" height="21" viewBox="0 0 20 20" fill="none" stroke="#4338ca" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 13l4-4 3 3 5-6" />
              </svg>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, letterSpacing: "-0.01em", color: "#0f172a" }}>
                Overview
              </span>
              <span style={{ font: `500 12.5px ${BODY}`, color: "#94a3b8" }}>
                {greeting}, {name} · {f.month}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                font: `600 12.5px ${DISPLAY}`,
                color: "#4338ca",
                background: INDIGO_PILL,
                border: "1px solid rgba(99,102,241,0.34)",
                borderRadius: 999,
                padding: "8px 14px",
                whiteSpace: "nowrap",
              }}
            >
              {f.month}
            </span>
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: `600 14px ${DISPLAY}`,
                color: "#4338ca",
                background: INDIGO_AVATAR,
                border: "1px solid rgba(99,102,241,0.45)",
              }}
            >
              {initials}
            </span>
          </div>
        </div>

        {/* Two-column grid: 1.32fr / 1fr, fixed viewport height so both columns end at
            the same bottom. The last card in each column fills the leftover space and
            scrolls internally (Recent payments left, Portfolio right). */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.32fr 1fr",
            gridTemplateRows: "minmax(0, 1fr)", // single row fills the grid's flex height
            gap: 24,
            alignItems: "stretch",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minHeight: 0 }}>
            <HeroBalance
              net={f.derived.net}
              month={f.month}
              earned={f.derived.earned}
              spent={f.derived.spent}
              invested={f.derived.invested}
              onPrev={f.prevMonth}
              onNext={f.nextMonth}
              loading={f.loading}
            />
            <TrendChart
              series={trend.series}
              loading={trend.loading}
              error={trend.error}
              window={trend.window}
              onWindow={trend.setWindow}
            />
            <div style={{ flex: 1, minHeight: 0 }}>
              <Transactions
                transactions={tx.rows}
                page={f.expPage}
                pages={f.expPages}
                onPageChange={f.setExpPage}
                onEdit={f.openEdit}
                loading={tx.loading}
                fill
                onLoadMore={tx.loadMore}
                loadingMore={tx.loadingMore}
                onAdd={() => f.openSheet("expense")}
              />
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minHeight: 0 }}>
            {(f.loading || f.bills.length > 0) && (
              <Bills
                bills={f.bills}
                page={f.billPage}
                pages={f.billPages}
                onPageChange={f.setBillPage}
                onEdit={f.openBillEdit}
                loading={f.loading}
                onAdd={() => f.openSheet("expense", { isBill: true, billKind: "once" })}
              />
            )}
            <Emis
              cards={f.emiCards}
              summary={f.emisSummary}
              onPay={f.pay}
              onEdit={f.openEmiEdit}
              loading={f.loading}
              onAdd={() => f.openSheet("expense", { isBill: true, billKind: "emi" })}
            />
            {(f.loading || f.income.length > 0) && (
              <Income
                income={f.income}
                incomeTotal={f.incomeTotal}
                incomeCompact={f.incomeCompact}
                loading={f.loading}
                onAdd={() => f.openSheet("income")}
              />
            )}
            <div style={{ flex: 1, minHeight: 0 }}>
              <Investments
                portfolioTotal={portfolio.portfolioTotal}
                fds={portfolio.fds}
                funds={portfolio.funds}
                sips={portfolio.sips}
                loading={portfolio.loading}
                fill
                onAdd={() => f.openSheet("investment")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add-actions live in each card header (contextual "+"), not a floating pill —
          keeps the dashboard unobstructed (specs/features/desktop-dashboard.md). */}

      {/* Shared overlays — mounted once, identical to MobileHome */}
      {f.sheet && (
        <AddSheet
          mode={f.sheet}
          amount={f.formAmount}
          note={f.formNote}
          cat={f.formCat}
          cats={f.cats}
          isBill={f.formIsBill}
          billKind={f.formBillKind}
          emiTotal={f.formEmiTotal}
          emiMonths={f.formEmiMonths}
          onAmount={f.setAmount}
          onNote={f.setNote}
          onCat={f.setCat}
          onToggleBill={f.setFormIsBill}
          onBillKind={f.setFormBillKind}
          onEmiTotal={f.setFormEmiTotal}
          onEmiMonths={f.setFormEmiMonths}
          onSave={f.saveEntry}
          onClose={f.closeSheet}
        />
      )}

      {f.editId && (
        <EditSheet
          amount={f.editAmount}
          title={f.editTitle}
          tag={f.editTag}
          cat={f.editCat}
          cats={f.cats}
          saving={f.editSaving}
          deleting={f.editDeleting}
          onAmount={f.setEditAmount}
          onTitle={f.setEditTitle}
          onTag={f.setEditTag}
          onCat={f.setEditCat}
          onSave={f.saveEdit}
          onDelete={f.deleteEdit}
          onClose={f.closeEdit}
        />
      )}

      {f.billEdit && (
        <BillEditSheet
          kind={f.billEdit.kind}
          name={f.billEdit.name}
          amount={f.billEdit.amount}
          total={f.billEdit.total}
          months={f.billEdit.months}
          saving={f.billEditSaving}
          deleting={f.billEditDeleting}
          onName={f.setBillEditName}
          onAmount={f.setBillEditAmount}
          onTotal={f.setBillEditTotal}
          onSave={f.saveBillEdit}
          onDelete={f.deleteBillEdit}
          onClose={f.closeBillEdit}
        />
      )}

      <Toaster />
    </div>
  );
}
