import { Topbar } from "@/components/layout/topbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { FunnelReport } from "@/components/reports/funnel-report";
import type { LeadSource, LeadStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; source?: string }>;
}) {
  const { period, source } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const me = await getCurrentUser();

  // ---------- Date range filter ----------
  const now = new Date();
  let dateFrom: Date;
  const selectedPeriod = period || "this_month";

  switch (selectedPeriod) {
    case "last_month": {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    }
    case "last_3_months": {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    }
    case "all_time": {
      dateFrom = new Date(2000, 0, 1);
      break;
    }
    default: {
      // this_month
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  // ---------- Build base query ----------
  const buildQuery = (status?: LeadStatus) => {
    let q = supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dateFrom.toISOString());

    if (status) q = q.eq("status", status);
    if (source && source !== "all") q = q.eq("source", source as LeadSource);
    return q;
  };

  // ---------- Parallel count queries ----------
  const [totalRes, newRes, consultingRes, wonRes, rejectedRes] =
    await Promise.all([
      buildQuery(),
      buildQuery("new"),
      buildQuery("consulting"),
      buildQuery("won"),
      buildQuery("rejected"),
    ]);

  const total = totalRes.count ?? 0;
  const newCount = newRes.count ?? 0;
  const consultingCount = consultingRes.count ?? 0;
  const wonCount = wonRes.count ?? 0;
  const rejectedCount = rejectedRes.count ?? 0;

  // ---------- Avg days per stage ----------
  let realAvgNew = 2;
  let realAvgConsulting = 5;
  let realAvgWon = 0;

  // Compute from actual data (avg time between created_at and updated_at per status)
  const { data: leadsWithDates } = await supabase
    .from("leads")
    .select("status, created_at, updated_at")
    .gte("created_at", dateFrom.toISOString());

  if (leadsWithDates && leadsWithDates.length > 0) {
    const daysByStatus: Record<string, number[]> = {
      new: [],
      consulting: [],
      won: [],
    };

    for (const lead of leadsWithDates) {
      const created = new Date(lead.created_at);
      const updated = new Date(lead.updated_at);
      const days = Math.max(
        1,
        Math.round(
          (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      if (daysByStatus[lead.status]) {
        daysByStatus[lead.status].push(days);
      }
    }

    const avg = (arr: number[]) =>
      arr.length > 0
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;

    realAvgNew = avg(daysByStatus.new) || 2;
    realAvgConsulting = avg(daysByStatus.consulting) || 5;
    realAvgWon = avg(daysByStatus.won) || 0;
  }

  // ---------- Daily avg new leads ----------
  const daysSinceStart = Math.max(
    1,
    Math.round(
      (now.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const dailyAvg = total > 0 ? (total / daysSinceStart).toFixed(1) : "0";

  const funnelData = {
    total,
    newCount,
    consultingCount,
    wonCount,
    rejectedCount,
    avgDaysNew: realAvgNew,
    avgDaysConsulting: realAvgConsulting,
    avgDaysWon: realAvgWon,
    dailyAvg,
    selectedPeriod,
    selectedSource: source || "all",
  };

  return (
    <>
      <Topbar
        title="Reports"
        userEmail={me.email}
        userName={me.fullName}
        avatarUrl={me.avatarUrl}
      />
      <section className="p-6 md:p-8 max-w-7xl mx-auto w-full pb-24">
        <FunnelReport data={funnelData} />
      </section>
    </>
  );
}
