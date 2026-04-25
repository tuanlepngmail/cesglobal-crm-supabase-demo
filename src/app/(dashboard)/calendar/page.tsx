import { Topbar } from "@/components/layout/topbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { CalendarView } from "@/components/calendar/calendar-view";

export const dynamic = "force-dynamic";

export type CalendarEvent = {
  id: string;
  leadId: string;
  leadName: string;
  leadStatus: string;
  type: string;
  title: string;
  occurredAt: string;
  isAutoReminder?: boolean;
};

export type CalendarLead = {
  id: string;
  full_name: string;
  status: string;
  position: string | null;
};

export type FollowUpSuggestion = {
  leadId: string;
  leadName: string;
  daysSince: number;
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month: mp, year: yp } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const me = await getCurrentUser();

  const now = new Date();
  const year = yp ? parseInt(yp) : now.getFullYear();
  const month = mp ? parseInt(mp) - 1 : now.getMonth();

  // Extend range ±7 days for prev/next month overflow in grid
  const rangeStart = new Date(year, month, -6);
  const rangeEnd = new Date(year, month + 1, 7, 23, 59, 59);

  // Fetch interactions with lead info
  const { data: rawInteractions } = await supabase
    .from("interactions")
    .select("id, lead_id, type, title, occurred_at, leads!inner(full_name, status)")
    .gte("occurred_at", rangeStart.toISOString())
    .lte("occurred_at", rangeEnd.toISOString())
    .order("occurred_at");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const events: CalendarEvent[] = (rawInteractions || []).map((i: any) => ({
    id: i.id,
    leadId: i.lead_id,
    leadName: i.leads?.full_name ?? "—",
    leadStatus: i.leads?.status ?? "new",
    type: i.type,
    title: i.title,
    occurredAt: i.occurred_at,
  }));

  // Follow-up suggestions: consulting leads with no recent interaction
  const { data: consultingLeads } = await supabase
    .from("leads")
    .select("id, full_name, status, position, created_at")
    .eq("status", "consulting");

  const consultingIds = (consultingLeads || []).map((l) => l.id);
  let latestByLead = new Map<string, string>();

  if (consultingIds.length > 0) {
    const { data: ixns } = await supabase
      .from("interactions")
      .select("lead_id, occurred_at")
      .in("lead_id", consultingIds)
      .order("occurred_at", { ascending: false });

    for (const i of ixns || []) {
      if (!latestByLead.has(i.lead_id)) latestByLead.set(i.lead_id, i.occurred_at);
    }
  }

  const suggestions: FollowUpSuggestion[] = [];
  for (const lead of consultingLeads || []) {
    const lastDate = latestByLead.get(lead.id) || lead.created_at;
    const days = Math.round((now.getTime() - new Date(lastDate).getTime()) / 864e5);
    if (days >= 2) suggestions.push({ leadId: lead.id, leadName: lead.full_name, daysSince: days });
  }

  // All leads for quick search
  const { data: allLeads } = await supabase
    .from("leads")
    .select("id, full_name, status, position")
    .order("full_name");

  // Today events
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayEvents = events.filter((e) => e.occurredAt.slice(0, 10) === todayStr);

  return (
    <>
      <Topbar
        title="Lịch làm việc"
        userEmail={me.email}
        userName={me.fullName}
        avatarUrl={me.avatarUrl}
      />
      <CalendarView
        events={events}
        year={year}
        month={month}
        leads={(allLeads || []) as CalendarLead[]}
        suggestions={suggestions}
        todayEvents={todayEvents}
      />
    </>
  );
}
