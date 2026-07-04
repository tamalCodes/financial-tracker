"use client";

import { useMemo } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useFinance } from "./useFinance";
import { usePortfolioData } from "./usePortfolioData";
import GreetingHeader from "./GreetingHeader";
import HeroBalance from "./HeroBalance";
import Transactions from "./Transactions";
import Income from "./Income";
import BillsEmis from "./BillsEmis";
import Investments from "./Investments";
import FloatingActionBar from "./FloatingActionBar";
import AddSheet from "./AddSheet";
import EditSheet from "./EditSheet";
import Toaster from "./Toaster";

// Identity for the greeting (§2.6): derive a display name + initials from the auth email.
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

// Mobile home — composes the screen in handoff §4 order, wired to the real API.
export default function MobileHome() {
  const { user } = useAuth();
  const f = useFinance();
  const portfolio = usePortfolioData();

  const { name, initials } = useMemo(() => identityFrom(user?.email), [user?.email]);
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column" }}>
        <GreetingHeader greeting={greeting} name={name} initials={initials} month={f.month} />

        <div
          style={{
            padding: "4px 16px 104px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
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
          <Transactions
            transactions={f.txView}
            page={f.expPage}
            pages={f.expPages}
            onPageChange={f.setExpPage}
            onEdit={f.openEdit}
            loading={f.loading}
          />
          {(f.loading || f.income.length > 0) && (
            <Income income={f.income} incomeTotal={f.incomeTotal} incomeCompact={f.incomeCompact} loading={f.loading} />
          )}
          {(f.loading || f.bills.length > 0) && (
            <BillsEmis bills={f.bills} paidTotal={f.paidTotal} emis={f.emis} onPay={f.pay} loading={f.loading} />
          )}
          <Investments
            portfolioTotal={portfolio.portfolioTotal}
            fds={portfolio.fds}
            funds={portfolio.funds}
            sips={portfolio.sips}
            loading={portfolio.loading}
          />
        </div>
      </div>

      <FloatingActionBar onOpen={f.openSheet} />

      {f.sheet && (
        <AddSheet
          mode={f.sheet}
          amount={f.formAmount}
          note={f.formNote}
          cat={f.formCat}
          cats={f.cats}
          isBill={f.formIsBill}
          due={f.formDue}
          billKind={f.formBillKind}
          emiTotal={f.formEmiTotal}
          emiMonths={f.formEmiMonths}
          onAmount={f.setAmount}
          onNote={f.setNote}
          onCat={f.setCat}
          onToggleBill={f.setFormIsBill}
          onDue={f.setFormDue}
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

      <Toaster />
    </div>
  );
}
