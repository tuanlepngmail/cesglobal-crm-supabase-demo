"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { FunnelChart } from "./funnel-chart";
import { cn } from "@/lib/utils";

type FunnelData = {
  total: number;
  newCount: number;
  consultingCount: number;
  wonCount: number;
  rejectedCount: number;
  avgDaysNew: number;
  avgDaysConsulting: number;
  avgDaysWon: number;
  dailyAvg: string;
  selectedPeriod: string;
  selectedSource: string;
};

const PERIODS = [
  { value: "this_month", label: "Tháng này" },
  { value: "last_month", label: "Tháng trước" },
  { value: "last_3_months", label: "3 tháng qua" },
  { value: "all_time", label: "Tất cả" },
];

const SOURCES = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "facebook", label: "Facebook Ads" },
  { value: "google", label: "Google Search" },
  { value: "zalo", label: "Zalo Ads" },
  { value: "referral", label: "Giới thiệu" },
  { value: "direct", label: "Trực tiếp" },
  { value: "other", label: "Khác" },
];

export function FunnelReport({ data }: { data: FunnelData }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        (key === "period" && value === "this_month") ||
        (key === "source" && value === "all")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.push(qs ? `/reports?${qs}` : "/reports");
    },
    [router, searchParams]
  );

  // Funnel conversion rates
  const totalIncoming = data.total;
  const rateNewToConsulting =
    totalIncoming > 0
      ? ((data.consultingCount + data.wonCount) / totalIncoming) * 100
      : 0;
  const rateConsultingToWon =
    data.consultingCount + data.wonCount > 0
      ? (data.wonCount / (data.consultingCount + data.wonCount)) * 100
      : 0;
  const winRate =
    totalIncoming > 0 ? ((data.wonCount / totalIncoming) * 100).toFixed(0) : "0";

  // Detect bottleneck
  const isBottleneck = rateConsultingToWon < rateNewToConsulting;
  const bottleneckStage = isBottleneck ? "consulting_to_won" : "new_to_consulting";

  // Funnel stages for the chart
  const stages = [
    {
      label: "Lead Mới",
      value: totalIncoming,
      color: "#4A90D9",
      icon: "person_add",
    },
    {
      label: "Đang tư vấn",
      value: data.consultingCount + data.wonCount,
      color: "#E8943A",
      icon: "forum",
    },
    {
      label: "Đã mua",
      value: data.wonCount,
      color: "#50B356",
      icon: "shopping_cart_checkout",
    },
  ];

  // Table data for source breakdown
  const tableRows = [
    {
      stage: "Lead Mới",
      count: totalIncoming,
      convRate: "—",
      avgDays: `${data.avgDaysNew} ngày`,
      isBottleneck: false,
    },
    {
      stage: "Đang tư vấn",
      count: data.consultingCount + data.wonCount,
      convRate: `${rateNewToConsulting.toFixed(1)}%`,
      avgDays: `${data.avgDaysConsulting} ngày`,
      isBottleneck: bottleneckStage === "new_to_consulting",
    },
    {
      stage: "Đã mua",
      count: data.wonCount,
      convRate: `${rateConsultingToWon.toFixed(1)}%`,
      avgDays: data.avgDaysWon > 0 ? `${data.avgDaysWon} ngày` : "N/A",
      isBottleneck: bottleneckStage === "consulting_to_won",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-medium text-near-black tracking-tight">
            Báo cáo Phễu Chuyển đổi{" "}
            <span className="text-stone-gray text-xl">(Conversion Funnel)</span>
          </h1>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 bg-near-black text-ivory rounded-xl text-[13px] font-semibold hover:bg-dark-warm active:scale-95 transition-all shadow-sm self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[17px]">
            download
          </span>
          Xuất báo cáo
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={data.selectedPeriod}
          onChange={(e) => updateFilter("period", e.target.value)}
          className="form-select px-4 py-2.5 bg-ivory border border-border-cream rounded-xl text-[13px] text-near-black font-medium focus:border-ring-warm focus:ring-2 focus:ring-focus-blue/20 outline-none transition-all cursor-pointer"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={data.selectedSource}
          onChange={(e) => updateFilter("source", e.target.value)}
          className="form-select px-4 py-2.5 bg-ivory border border-border-cream rounded-xl text-[13px] text-near-black font-medium focus:border-ring-warm focus:ring-2 focus:ring-focus-blue/20 outline-none transition-all cursor-pointer"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => router.push("/reports")}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-terracotta text-ivory rounded-xl text-[13px] font-semibold hover:bg-coral active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined !text-[16px]">
            filter_alt
          </span>
          Lọc
        </button>
      </div>

      {/* Main content: Funnel + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Funnel Chart — Left Panel */}
        <div className="lg:col-span-3 bg-ivory rounded-2xl ring-shadow whisper-shadow p-6 md:p-8">
          <FunnelChart
            stages={stages}
            rateNewToConsulting={rateNewToConsulting}
            rateConsultingToWon={rateConsultingToWon}
            bottleneckStage={bottleneckStage}
          />
        </div>

        {/* Summary — Right Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Win rate + Daily avg */}
          <div className="bg-ivory rounded-2xl ring-shadow whisper-shadow p-6">
            <h3 className="font-headline text-lg font-medium text-near-black mb-5">
              Tóm tắt Chuyển đổi & Phân tích
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[11px] font-semibold text-stone-gray uppercase tracking-widest mb-1">
                  Tỷ lệ Chuyển đổi Tổng thể
                </p>
                <p className="font-headline text-3xl font-medium text-near-black">
                  {winRate}%{" "}
                  <span className="text-sm text-stone-gray font-body">
                    ({data.wonCount}/{totalIncoming})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-stone-gray uppercase tracking-widest mb-1">
                  Số Lead Mới trung bình mỗi ngày
                </p>
                <p className="font-headline text-3xl font-medium text-near-black">
                  {data.dailyAvg}
                </p>
              </div>
            </div>

            {/* Avg days per stage */}
            <div className="border-t border-border-cream pt-4">
              <p className="text-[12px] font-semibold text-near-black mb-3">
                Số Ngày trung bình ở mỗi giai đoạn
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11px] text-stone-gray mb-1">Lead Mới</p>
                  <p className="font-headline text-xl font-medium text-near-black">
                    {data.avgDaysNew}{" "}
                    <span className="text-xs text-stone-gray font-body">
                      ngày
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-stone-gray mb-1">
                    Đang tư vấn
                  </p>
                  <p className="font-headline text-xl font-medium text-near-black">
                    {data.avgDaysConsulting}{" "}
                    <span className="text-xs text-stone-gray font-body">
                      ngày
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-stone-gray mb-1">Đã mua</p>
                  <p className="font-headline text-xl font-medium text-stone-gray">
                    N/A
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottleneck analysis */}
          <div
            className={cn(
              "rounded-2xl p-5 border",
              isBottleneck
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "material-symbols-outlined !text-[22px] mt-0.5",
                  isBottleneck ? "text-amber-600" : "text-emerald-600"
                )}
              >
                {isBottleneck ? "warning" : "check_circle"}
              </span>
              <div>
                <p
                  className={cn(
                    "text-[13px] font-semibold mb-1",
                    isBottleneck ? "text-amber-800" : "text-emerald-800"
                  )}
                >
                  Phân tích Nút thắt:
                </p>
                <p
                  className={cn(
                    "text-[12px] leading-relaxed",
                    isBottleneck ? "text-amber-700" : "text-emerald-700"
                  )}
                >
                  {isBottleneck
                    ? `Tỷ lệ chuyển đổi từ 'Đang tư vấn' sang 'Đã mua' chỉ đạt ${rateConsultingToWon.toFixed(
                        0
                      )}%. Cần xem xét tối ưu hóa quy trình demo sản phẩm hoặc điều chỉnh giá cả.`
                    : `Phễu chuyển đổi đang hoạt động tốt. Tỷ lệ win rate đạt ${winRate}% — tiếp tục duy trì chiến lược hiện tại.`}
                </p>
              </div>
            </div>
          </div>

          {/* Stage breakdown table */}
          <div className="bg-ivory rounded-2xl ring-shadow whisper-shadow overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border-cream bg-warm-sand/50">
                  <th className="text-left px-4 py-3 font-semibold text-stone-gray uppercase tracking-widest">
                    Nguồn
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-gray uppercase tracking-widest">
                    Lead Mới
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-gray uppercase tracking-widest">
                    Đang tư vấn (%)
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-gray uppercase tracking-widest">
                    Đã mua (%)
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-stone-gray uppercase tracking-widest">
                    Nút thắt
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr
                    key={row.stage}
                    className="border-b border-border-cream last:border-0 hover:bg-warm-sand/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-near-black">
                      {row.stage}
                    </td>
                    <td className="px-4 py-3 text-charcoal-warm tabular-nums">
                      {row.count}
                    </td>
                    <td className="px-4 py-3 text-charcoal-warm tabular-nums">
                      {row.convRate}
                    </td>
                    <td className="px-4 py-3 text-charcoal-warm tabular-nums">
                      {row.avgDays}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.isBottleneck ? (
                        <span className="text-error-crimson font-semibold">
                          Yes
                        </span>
                      ) : (
                        <span className="text-stone-gray">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
