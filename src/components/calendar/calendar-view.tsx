"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createCalendarEvent, moveCalendarEvent } from "@/app/(dashboard)/calendar/actions";
import type { CalendarEvent, CalendarLead, FollowUpSuggestion } from "@/app/(dashboard)/calendar/page";

/* ───────── helpers ───────── */
const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
const VIEWS = ["Tháng", "Tuần", "Ngày", "Agenda"] as const;

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const gridStart = new Date(year, month, 1 - startDow);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  call:    { bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-800", dot: "bg-sky-500" },
  meeting: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", dot: "bg-amber-500" },
  email:   { bg: "bg-stone-100", border: "border-stone-300", text: "text-stone-700", dot: "bg-stone-500" },
  chat:    { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", dot: "bg-violet-500" },
  auto:    { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-800", dot: "bg-emerald-500" },
  overdue: { bg: "bg-red-50", border: "border-red-300", text: "text-red-800", dot: "bg-red-500" },
};

/* ───────── main component ───────── */
type Props = {
  events: CalendarEvent[];
  year: number;
  month: number;
  leads: CalendarLead[];
  suggestions: FollowUpSuggestion[];
  todayEvents: CalendarEvent[];
};

export function CalendarView({ events, year, month, leads, suggestions, todayEvents }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [view, setView] = useState<(typeof VIEWS)[number]>("Tháng");
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [showPanel, setShowPanel] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);

  const today = new Date();
  const todayKey = dateKey(today);
  const grid = getMonthGrid(year, month);

  // Group events by date
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const k = ev.occurredAt.slice(0, 10);
    if (!eventsByDate.has(k)) eventsByDate.set(k, []);
    eventsByDate.get(k)!.push(ev);
  }

  const navigate = useCallback(
    (dir: number) => {
      const d = new Date(year, month + dir, 1);
      router.push(`/calendar?year=${d.getFullYear()}&month=${d.getMonth() + 1}`);
    },
    [router, year, month],
  );

  const goToday = () => {
    router.push("/calendar");
  };

  const openModal = (dayDate: Date) => {
    const iso = dayDate.toISOString().slice(0, 16);
    setModalDate(iso);
    setShowModal(true);
  };

  const handleDrop = (targetDate: Date) => {
    if (!dragId) return;
    const newOccurred = new Date(targetDate);
    newOccurred.setHours(9, 0, 0, 0);
    startTransition(async () => {
      await moveCalendarEvent(dragId, newOccurred.toISOString());
      router.refresh();
    });
    setDragId(null);
  };

  /* ───── Event color helper ───── */
  const getColor = (ev: CalendarEvent) => {
    if (ev.isAutoReminder) return EVENT_COLORS.auto;
    // Check overdue: consulting lead with event in the past
    if (ev.leadStatus === "consulting" && new Date(ev.occurredAt) < today) {
      return EVENT_COLORS.overdue;
    }
    return EVENT_COLORS[ev.type] || EVENT_COLORS.call;
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ────── Calendar main ────── */}
      <div className="flex-1 flex flex-col overflow-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl md:text-3xl font-medium text-near-black">
              {MONTH_NAMES[month]} {year}
            </h1>
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-warm-sand rounded-lg transition-colors text-olive-gray" title="Tháng trước">
                <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
              </button>
              <button onClick={() => navigate(1)} className="p-1.5 hover:bg-warm-sand rounded-lg transition-colors text-olive-gray" title="Tháng sau">
                <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
              </button>
              <button onClick={goToday} className="ml-1 px-3 py-1 text-[12px] font-semibold bg-warm-sand text-near-black rounded-lg hover:bg-border-cream transition-colors">
                Today
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex bg-warm-sand rounded-xl p-0.5">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
                    view === v ? "bg-ivory text-near-black shadow-sm" : "text-olive-gray hover:text-near-black",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setModalDate(new Date().toISOString().slice(0, 16)); setShowModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-terracotta text-ivory rounded-xl text-[13px] font-semibold hover:bg-coral active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined !text-[17px]">add</span>
              Thêm sự kiện
            </button>
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="p-2 text-olive-gray hover:bg-warm-sand rounded-xl transition-colors md:hidden"
              title="Trợ lý"
            >
              <span className="material-symbols-outlined !text-[20px]">assistant</span>
            </button>
          </div>
        </div>

        {/* Month Grid */}
        {view === "Tháng" && (
          <div className="bg-ivory rounded-2xl ring-shadow whisper-shadow overflow-hidden flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border-cream">
              {DAYS.map((d) => (
                <div key={d} className="px-2 py-2.5 text-center text-[11px] font-semibold text-stone-gray uppercase tracking-widest">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells — 6 rows */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1">
              {grid.map((day, idx) => {
                const key = dateKey(day);
                const isCurrentMonth = day.getMonth() === month;
                const isToday = key === todayKey;
                const dayEvents = eventsByDate.get(key) || [];

                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[100px] border-b border-r border-border-cream p-1.5 cursor-pointer transition-colors",
                      !isCurrentMonth && "bg-warm-sand/30",
                      isToday && "bg-sky-50/50",
                      "hover:bg-warm-sand/40",
                    )}
                    onClick={() => openModal(day)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(day)}
                  >
                    {/* Date number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full",
                          isToday ? "bg-terracotta text-ivory" : isCurrentMonth ? "text-near-black" : "text-warm-silver",
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    {/* Events */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const c = getColor(ev);
                        return (
                          <div
                            key={ev.id}
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); setDragId(ev.id); }}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate border cursor-grab active:cursor-grabbing",
                              c.bg, c.border, c.text,
                            )}
                            title={`${ev.title} — ${ev.leadName}`}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-stone-gray pl-1">
                          +{dayEvents.length - 3} khác
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Agenda view */}
        {view === "Agenda" && (
          <div className="bg-ivory rounded-2xl ring-shadow whisper-shadow p-6 space-y-3">
            <h3 className="font-headline text-lg font-medium text-near-black mb-4">Lịch trình tháng {month + 1}</h3>
            {events.length === 0 && <p className="text-stone-gray text-[13px]">Không có sự kiện nào.</p>}
            {events.map((ev) => {
              const c = getColor(ev);
              const d = new Date(ev.occurredAt);
              return (
                <div key={ev.id} className={cn("flex items-center gap-3 p-3 rounded-xl border", c.bg, c.border)}>
                  <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[13px] font-semibold truncate", c.text)}>{ev.title}</p>
                    <p className="text-[11px] text-stone-gray">{ev.leadName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-medium text-near-black">
                      {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
                    </p>
                    <p className="text-[11px] text-stone-gray">
                      {String(d.getHours()).padStart(2, "0")}:{String(d.getMinutes()).padStart(2, "0")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Placeholder for Week / Day */}
        {(view === "Tuần" || view === "Ngày") && (
          <div className="bg-ivory rounded-2xl ring-shadow whisper-shadow p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined !text-[48px] text-warm-silver mb-3">construction</span>
            <p className="text-stone-gray text-[14px]">Chế độ xem <strong>{view}</strong> đang được phát triển.</p>
          </div>
        )}
      </div>

      {/* ────── Smart Assistant Panel ────── */}
      {showPanel && (
        <aside className="hidden md:flex flex-col w-80 border-l border-border-cream bg-ivory overflow-y-auto shrink-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-headline text-[15px] font-medium text-near-black">Trợ lý CRM Pro</h3>
            <button onClick={() => setShowPanel(false)} className="p-1 text-olive-gray hover:text-near-black rounded-lg hover:bg-warm-sand transition-colors">
              <span className="material-symbols-outlined !text-[18px]">close</span>
            </button>
          </div>

          {/* Follow-up suggestions */}
          <div className="px-5 pb-4">
            <p className="text-[11px] font-semibold text-terracotta uppercase tracking-widest mb-3">Cần Follow-up gấp</p>
            {suggestions.length === 0 && <p className="text-[12px] text-stone-gray">Không có lead cần follow-up.</p>}
            {suggestions.map((s) => (
              <div key={s.leadId} className="mb-3 p-3 bg-red-50/60 border border-red-200 rounded-xl">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-red-700 leading-relaxed">
                      <span className="font-semibold">Tự động:</span> Liên hệ lại{" "}
                      <span className="font-semibold">{s.leadName}</span>
                    </p>
                    <p className="text-[11px] text-red-600 mt-0.5">{s.daysSince} ngày chưa phản hồi</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Đang tư vấn
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setModalDate(new Date().toISOString().slice(0, 16)); setShowModal(true); }}
                    className="flex-1 text-[11px] font-semibold py-1.5 bg-ivory border border-border-cream rounded-lg text-near-black hover:bg-warm-sand transition-colors"
                  >
                    Tạo lịch
                  </button>
                  <button
                    onClick={() => { setModalDate(new Date().toISOString().slice(0, 16)); setShowModal(true); }}
                    className="flex-1 text-[11px] font-semibold py-1.5 bg-ivory border border-border-cream rounded-lg text-near-black hover:bg-warm-sand transition-colors"
                  >
                    Thêm sự kiện
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Today's events */}
          <div className="px-5 pb-5 border-t border-border-cream pt-4">
            <p className="text-[11px] font-semibold text-near-black uppercase tracking-widest mb-3">Sự kiện hôm nay</p>
            {todayEvents.length === 0 && <p className="text-[12px] text-stone-gray">Không có sự kiện hôm nay.</p>}
            {todayEvents.map((ev) => {
              const c = getColor(ev);
              const d = new Date(ev.occurredAt);
              return (
                <div key={ev.id} className="flex items-start gap-2.5 mb-3">
                  <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", c.dot)} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-near-black truncate">{ev.title}</p>
                    <p className="text-[11px] text-stone-gray">
                      {String(d.getHours()).padStart(2, "0")}:{String(d.getMinutes()).padStart(2, "0")} — {ev.leadName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* ────── Quick Schedule Modal ────── */}
      {showModal && (
        <QuickScheduleModal
          date={modalDate}
          leads={leads}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/* Quick Schedule Modal                           */
/* ═══════════════════════════════════════════════ */
function QuickScheduleModal({
  date,
  leads,
  onClose,
}: {
  date: string;
  leads: CalendarLead[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<CalendarLead | null>(null);
  const [eventType, setEventType] = useState<string>("call");
  const [title, setTitle] = useState("");
  const [occurredAt, setOccurredAt] = useState(date);

  const filtered = search.length > 0
    ? leads.filter((l) => l.full_name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      new: "bg-sky-100 text-sky-700",
      consulting: "bg-amber-100 text-amber-700",
      won: "bg-emerald-100 text-emerald-700",
      rejected: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      new: "Mới",
      consulting: "Đang tư vấn",
      won: "Đã mua",
      rejected: "Từ chối",
    };
    return (
      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", map[s] || map.new)}>
        {labels[s] || s}
      </span>
    );
  };

  const handleSubmit = () => {
    if (!selectedLead || !title || !occurredAt) return;
    const fd = new FormData();
    fd.set("leadId", selectedLead.id);
    fd.set("type", eventType);
    fd.set("title", title);
    fd.set("occurredAt", new Date(occurredAt).toISOString());

    startTransition(async () => {
      const result = await createCalendarEvent(fd);
      if (result.success) {
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-ivory rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="font-headline text-lg font-medium text-near-black">Tạo Lịch Hẹn Mới</h3>
          <button onClick={onClose} className="p-1 text-olive-gray hover:text-near-black rounded-lg hover:bg-warm-sand transition-colors">
            <span className="material-symbols-outlined !text-[20px]">close</span>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Lead search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-gray !text-[18px]">search</span>
            <input
              type="text"
              placeholder="Tìm nhanh Lead..."
              value={selectedLead ? selectedLead.full_name : search}
              onChange={(e) => { setSearch(e.target.value); setSelectedLead(null); }}
              className="w-full pl-9 pr-4 py-2.5 bg-warm-sand border border-border-cream rounded-xl text-[13px] placeholder:text-warm-silver focus:bg-ivory focus:border-ring-warm focus:ring-2 focus:ring-focus-blue/20 outline-none transition-all"
            />
            {/* Dropdown */}
            {filtered.length > 0 && !selectedLead && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-ivory border border-border-cream rounded-xl shadow-lg z-10 overflow-hidden">
                {filtered.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { setSelectedLead(l); setSearch(""); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-warm-sand transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center text-[11px] font-semibold text-terracotta shrink-0">
                      {l.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-near-black truncate">{l.full_name}</p>
                      {l.position && <p className="text-[11px] text-stone-gray truncate">{l.position}</p>}
                    </div>
                    {statusBadge(l.status)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Event type */}
          <div>
            <p className="text-[12px] font-semibold text-near-black mb-2">Loại sự kiện</p>
            <div className="flex gap-3">
              {[
                { value: "call", label: "Calling", icon: "call" },
                { value: "meeting", label: "Meeting", icon: "groups" },
                { value: "email", label: "Follow-up", icon: "mail" },
              ].map((t) => (
                <label
                  key={t.value}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer text-[12px] font-medium transition-all",
                    eventType === t.value
                      ? "border-terracotta bg-terracotta/10 text-terracotta"
                      : "border-border-cream text-olive-gray hover:border-ring-warm",
                  )}
                >
                  <input
                    type="radio"
                    name="eventType"
                    value={t.value}
                    checked={eventType === t.value}
                    onChange={() => setEventType(t.value)}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined !text-[16px]">{t.icon}</span>
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Tiêu đề sự kiện..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-warm-sand border border-border-cream rounded-xl text-[13px] placeholder:text-warm-silver focus:bg-ivory focus:border-ring-warm focus:ring-2 focus:ring-focus-blue/20 outline-none transition-all"
          />

          {/* Date/Time */}
          <div>
            <p className="text-[12px] font-semibold text-near-black mb-2">Thời gian</p>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full px-4 py-2.5 bg-warm-sand border border-border-cream rounded-xl text-[13px] focus:bg-ivory focus:border-ring-warm focus:ring-2 focus:ring-focus-blue/20 outline-none transition-all"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!selectedLead || !title || isPending}
            className={cn(
              "w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all",
              selectedLead && title
                ? "bg-terracotta text-ivory hover:bg-coral active:scale-[0.98] shadow-sm"
                : "bg-warm-sand text-warm-silver cursor-not-allowed",
            )}
          >
            {isPending ? "Đang tạo..." : "Tạo lịch hẹn"}
          </button>
        </div>
      </div>
    </div>
  );
}
