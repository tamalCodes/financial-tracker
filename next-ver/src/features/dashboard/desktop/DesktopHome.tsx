"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { identityFrom } from "@/features/auth/identity";
import { useInfiniteExpenses } from "@/features/dashboard/hooks/useInfiniteExpenses";
import { useTrendData } from "@/features/dashboard/hooks/useTrendData";
import AddSheet from "@/features/dashboard/mobile/AddSheet";
import AvatarMenu from "@/features/dashboard/mobile/AvatarMenu";
import BillEditSheet from "@/features/dashboard/mobile/BillEditSheet";
import Bills from "@/features/dashboard/mobile/Bills";
import { BODY, DISPLAY } from "@/features/dashboard/mobile/data";
import EditSheet from "@/features/dashboard/mobile/EditSheet";
import Emis from "@/features/dashboard/mobile/Emis";
import HeroBalance from "@/features/dashboard/mobile/HeroBalance";
import Income from "@/features/dashboard/mobile/Income";
import Investments from "@/features/dashboard/mobile/Investments";
import PortfolioManager from "@/features/dashboard/mobile/PortfolioManager";
import SipPaymentSheet from "@/features/dashboard/mobile/SipPaymentSheet";
import Toaster from "@/features/dashboard/mobile/Toaster";
import Transactions from "@/features/dashboard/mobile/Transactions";
import { useFinance } from "@/features/dashboard/mobile/useFinance";
import { usePortfolioData } from "@/features/dashboard/mobile/usePortfolioData";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const TrendChart = dynamic(() => import("./TrendChart"), {
  ssr: false,
  loading: () => (
    <div
      aria-label="Loading monthly trend"
      style={{
        height: 352,
        border: "1px solid var(--c-line)",
        borderRadius: 28,
        background: "var(--c-surface)",
      }}
    />
  ),
});

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const ACCENT_PILL =
  "linear-gradient(135deg,rgb(var(--c-accent-rgb) / 0.18),rgb(var(--c-accent-rgb) / 0.09))";
const ACCENT_BADGE =
  "linear-gradient(135deg,rgb(var(--c-accent-rgb) / 0.30),rgb(var(--c-accent-rgb) / 0.16))";

// Desktop / tablet-landscape home. Reuses the same data hooks and cards as MobileHome
// (specs/features/desktop-dashboard.md), reflowed into a two-column dashboard with a
// monthly-trend chart. Rendered by Dashboard.tsx when the viewport is ≥ 1024px.
export default function DesktopHome() {
  const { user } = useAuth();
  const f = useFinance();
  const portfolio = usePortfolioData();
  const [portfolioManagerOpen, setPortfolioManagerOpen] = useState(false);
  const [sipPaymentOpen, setSipPaymentOpen] = useState(false);
  const trend = useTrendData(f.currentMonth);
  // Desktop "Recent payments" scrolls + appends instead of paging. Reload the list
  // when the month changes (handled inside) or the expense count shifts (add/delete).
  const tx = useInfiniteExpenses(f.currentMonth, f.derived.count);

  const { name, initials } = useMemo(
    () => identityFrom(user?.fullName, user?.email),
    [user?.fullName, user?.email],
  );
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  return (
    <div
      style={{
        minHeight: "100vh",
        overflowY: "auto",
        background:
          "radial-gradient(1200px 700px at 50% -200px,var(--c-bg1),var(--c-bg2))",
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
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: ACCENT_BADGE,
                border: "1px solid rgb(var(--c-accent-rgb) / 0.45)",
              }}
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 20 20"
                fill="none"
                stroke="var(--c-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 13l4-4 3 3 5-6" />
              </svg>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 19,
                  letterSpacing: "-0.01em",
                  color: "var(--c-ink)",
                }}
              >
                Overview
              </span>
              <span style={{ font: `500 12.5px ${BODY}`, color: "var(--c-muted)" }}>
                {greeting}, {name}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                font: `600 12.5px ${DISPLAY}`,
                color: "var(--c-accent)",
                background: ACCENT_PILL,
                border: "1px solid rgb(var(--c-accent-rgb) / 0.34)",
                borderRadius: 999,
                padding: "8px 14px",
                whiteSpace: "nowrap",
              }}
            >
              {f.month}
            </span>
            <AvatarMenu initials={initials} size={42} />
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
            // Height floor: on short viewports (MacBook Air, split-screen) the flex
            // fill would crush the fill cards (Recent payments / Portfolio) to near
            // zero. Give the grid a minimum so cards stay usable; the root scrolls to
            // reveal the overflow while each fill card keeps its own internal scroll.
            minHeight: 640,
          }}
        >
          {/* Left column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minHeight: 0,
            }}
          >
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
            <div style={{ flex: 1, minHeight: 260 }}>
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minHeight: 0,
            }}
          >
            {/* Bills always renders on desktop (like EMIs) so its "+" is reachable;
                empty state lives inside the card. Mobile still hides it at zero. */}
            <Bills
              bills={f.bills}
              page={f.billPage}
              pages={f.billPages}
              onPageChange={f.setBillPage}
              onEdit={f.openBillEdit}
              loading={f.loading}
              onAdd={() =>
                f.openSheet("expense", { isBill: true, billKind: "once" })
              }
            />
            <Emis
              cards={f.emiCards}
              summary={f.emisSummary}
              onPay={f.pay}
              onEdit={f.openEmiEdit}
              loading={f.loading}
              onAdd={() =>
                f.openSheet("expense", { isBill: true, billKind: "emi" })
              }
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
            <div style={{ flex: 1, minHeight: 260 }}>
              <Investments
                portfolioTotal={portfolio.portfolioTotal}
                fds={portfolio.fds}
                funds={portfolio.funds}
                sips={portfolio.sips}
                loading={portfolio.loading}
                fill
                onAdd={() => f.openSheet("investment")}
                onManage={() => setPortfolioManagerOpen(true)}
                onRecordSips={() => setSipPaymentOpen(true)}
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
          paidCount={f.billEdit.paidCount}
          startMonth={f.billEdit.startMonth}
          saving={f.billEditSaving}
          deleting={f.billEditDeleting}
          onName={f.setBillEditName}
          onAmount={f.setBillEditAmount}
          onTotal={f.setBillEditTotal}
          onPaidCount={f.setBillEditPaidCount}
          onStartMonth={f.setBillEditStartMonth}
          onSave={f.saveBillEdit}
          onDelete={f.deleteBillEdit}
          onClose={f.closeBillEdit}
        />
      )}

      {portfolioManagerOpen && <PortfolioManager onClose={() => setPortfolioManagerOpen(false)} onDone={portfolio.reload} />}
      {sipPaymentOpen && <SipPaymentSheet sips={portfolio.sips} currentMonth={f.currentMonth} onClose={() => setSipPaymentOpen(false)} onDone={async () => { await Promise.all([portfolio.reload(), f.reload()]); }} />}

      <Toaster />
    </div>
  );
}
