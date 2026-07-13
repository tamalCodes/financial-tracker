import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmiProgress } from "@/features/dashboard/types/types";

// EMIs live on the `bills` table as pre-created installment rows sharing an `emi_id`.
// This rolls every EMI group up into progress figures across all months. Shared by
// GET /api/emis and the dashboard payload (initial paint) so the mobile home needs
// one request, not two.
export const loadEmiProgress = async (
  supabase: SupabaseClient,
  userId: string
): Promise<EmiProgress[]> => {
  const { data, error } = await supabase
    .from("bills")
    .select("emi_id, name, amount, paid, month, emi_seq, emi_months, emi_total")
    .eq("user_id", userId)
    .not("emi_id", "is", null);

  if (error) throw new Error(error.message);

  const groups = new Map<string, EmiProgress>();
  for (const r of data ?? []) {
    const id = r.emi_id as string;
    let g = groups.get(id);
    if (!g) {
      g = {
        emi_id: id,
        name: r.name as string,
        monthly: Number(r.amount),
        total: Number(r.emi_total ?? 0),
        months: Number(r.emi_months ?? 0),
        startMonth: r.month as string, // provisional; corrected by emi_seq 1 / earliest below
        paidCount: 0,
        paidAmount: 0,
        remainingCount: 0,
        remainingAmount: 0,
      };
      groups.set(id, g);
    }
    // Start month = the emi_seq 1 row's month (fallback: earliest month seen).
    if (Number(r.emi_seq) === 1 || (r.month as string) < g.startMonth) {
      g.startMonth = r.month as string;
    }
    if (r.paid) {
      g.paidCount += 1;
      g.paidAmount += Number(r.amount);
    } else {
      g.remainingCount += 1;
      g.remainingAmount += Number(r.amount);
    }
  }

  // Active EMIs first (something still due), then by name.
  return [...groups.values()].sort(
    (a, b) =>
      Number(b.remainingCount > 0) - Number(a.remainingCount > 0) ||
      a.name.localeCompare(b.name)
  );
};
