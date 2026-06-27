"use client";

import { FDS, FUNDS, PORTFOLIO_TOTAL, SIPS } from "./data";
import { useFinanceDemo } from "./useFinanceDemo";
import GreetingHeader from "./GreetingHeader";
import HeroBalance from "./HeroBalance";
import Transactions from "./Transactions";
import BillsEmis from "./BillsEmis";
import Investments from "./Investments";
import FloatingActionBar from "./FloatingActionBar";
import AddSheet from "./AddSheet";

// Mobile home — composes the screen in handoff §4 order. Demo data only (no backend).
// In a real app the OS draws the status bar; we skip the prototype's device frame.
export default function MobileHome() {
  const f = useFinanceDemo();

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 412, maxWidth: "100%", display: "flex", flexDirection: "column" }}>
        <GreetingHeader month={f.month} />

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
          />
          <Transactions transactions={f.txView} count={f.derived.count} logged={f.derived.logged} />
          <BillsEmis bills={f.bills} paidTotal={f.paidTotal} onPay={f.pay} />
          <Investments portfolioTotal={PORTFOLIO_TOTAL} fds={FDS} funds={FUNDS} sips={SIPS} />
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
          onAmount={f.setAmount}
          onNote={f.setNote}
          onCat={f.setCat}
          onSave={f.saveEntry}
          onClose={f.closeSheet}
        />
      )}
    </div>
  );
}
