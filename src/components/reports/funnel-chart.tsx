"use client";

import { cn } from "@/lib/utils";

type FunnelStage = {
  label: string;
  value: number;
  color: string;
  icon: string;
};

type FunnelChartProps = {
  stages: FunnelStage[];
  rateNewToConsulting: number;
  rateConsultingToWon: number;
  bottleneckStage: string;
};

export function FunnelChart({
  stages,
  rateNewToConsulting,
  rateConsultingToWon,
  bottleneckStage,
}: FunnelChartProps) {
  const isBottleneckConsulting = bottleneckStage === "consulting_to_won";

  return (
    <div className="flex flex-col items-center gap-2 relative">
      {/* Stage 1 — Lead Mới */}
      <div className="flex items-center gap-6 w-full">
        <div className="flex items-center gap-2 w-32 shrink-0 justify-end">
          <span className="material-symbols-outlined !text-[22px] text-[#4A90D9]">
            {stages[0].icon}
          </span>
          <span className="text-[13px] font-semibold text-near-black whitespace-nowrap">
            {stages[0].label}
          </span>
        </div>
        <div className="flex-1 flex justify-center">
          <svg viewBox="0 0 300 90" className="w-full max-w-[320px]">
            {/* Funnel top — widest */}
            <defs>
              <linearGradient
                id="grad1"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#5BA3E6" />
                <stop offset="100%" stopColor="#4A90D9" />
              </linearGradient>
            </defs>
            <path
              d="M 10,5 L 290,5 L 265,85 L 35,85 Z"
              fill="url(#grad1)"
              rx="8"
            />
            <text
              x="150"
              y="42"
              textAnchor="middle"
              fill="white"
              fontSize="28"
              fontWeight="600"
              fontFamily="Newsreader, Lora, Georgia, serif"
            >
              {stages[0].value}
            </text>
            <text
              x="150"
              y="68"
              textAnchor="middle"
              fill="rgba(255,255,255,0.75)"
              fontSize="11"
              fontFamily="Inter, system-ui, sans-serif"
            >
              100% of incoming leads
            </text>
          </svg>
        </div>
      </div>

      {/* Arrow 1: New → Consulting */}
      <div className="flex items-center gap-6 w-full">
        <div className="w-32 shrink-0" />
        <div className="flex-1 flex items-center justify-center gap-4">
          <span className="material-symbols-outlined !text-[28px] text-[#4A90D9] animate-bounce">
            arrow_downward
          </span>
          <span className="text-[12px] text-olive-gray font-medium bg-warm-sand px-3 py-1 rounded-lg">
            Chuyển sang Tư vấn:{" "}
            <strong className="text-near-black">
              {rateNewToConsulting.toFixed(0)}%
            </strong>{" "}
            ({stages[1].value})
          </span>
        </div>
      </div>

      {/* Stage 2 — Đang tư vấn */}
      <div className="flex items-center gap-6 w-full">
        <div className="flex items-center gap-2 w-32 shrink-0 justify-end">
          <span className="material-symbols-outlined !text-[22px] text-[#E8943A]">
            {stages[1].icon}
          </span>
          <span className="text-[13px] font-semibold text-near-black whitespace-nowrap">
            {stages[1].label}
          </span>
        </div>
        <div className="flex-1 flex justify-center">
          <svg viewBox="0 0 300 90" className="w-full max-w-[320px]">
            <defs>
              <linearGradient
                id="grad2"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#F0A54B" />
                <stop offset="100%" stopColor="#E8943A" />
              </linearGradient>
            </defs>
            <path
              d="M 50,5 L 250,5 L 225,85 L 75,85 Z"
              fill="url(#grad2)"
            />
            <text
              x="150"
              y="55"
              textAnchor="middle"
              fill="white"
              fontSize="28"
              fontWeight="600"
              fontFamily="Newsreader, Lora, Georgia, serif"
            >
              {stages[1].value}
            </text>
          </svg>
        </div>
      </div>

      {/* Arrow 2: Consulting → Won + Bottleneck indicator */}
      <div className="flex items-center gap-6 w-full">
        <div className="w-32 shrink-0" />
        <div className="flex-1 flex items-center justify-center gap-4">
          <span
            className={cn(
              "material-symbols-outlined !text-[28px] animate-bounce",
              isBottleneckConsulting ? "text-error-crimson" : "text-emerald-500"
            )}
          >
            arrow_downward
          </span>
          <span
            className={cn(
              "text-[12px] font-medium px-3 py-1 rounded-lg",
              isBottleneckConsulting
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700"
            )}
          >
            Chuyển đổi:{" "}
            <strong>{rateConsultingToWon.toFixed(0)}%</strong>
          </span>
          {isBottleneckConsulting && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-error-crimson bg-red-50 border border-red-300 px-2.5 py-1 rounded-lg animate-pulse">
              <span className="material-symbols-outlined !text-[14px]">
                warning
              </span>
              Nút thắt!
            </span>
          )}
        </div>
      </div>

      {/* Stage 3 — Đã mua */}
      <div className="flex items-center gap-6 w-full">
        <div className="flex items-center gap-2 w-32 shrink-0 justify-end">
          <span className="material-symbols-outlined !text-[22px] text-emerald-600">
            {stages[2].icon}
          </span>
          <span className="text-[13px] font-semibold text-near-black whitespace-nowrap">
            {stages[2].label}
          </span>
        </div>
        <div className="flex-1 flex justify-center">
          <svg viewBox="0 0 300 90" className="w-full max-w-[320px]">
            <defs>
              <linearGradient
                id="grad3"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#5EC463" />
                <stop offset="100%" stopColor="#50B356" />
              </linearGradient>
            </defs>
            <path
              d="M 90,5 L 210,5 L 195,85 L 105,85 Z"
              fill="url(#grad3)"
            />
            <text
              x="150"
              y="55"
              textAnchor="middle"
              fill="white"
              fontSize="28"
              fontWeight="600"
              fontFamily="Newsreader, Lora, Georgia, serif"
            >
              {stages[2].value}
            </text>
          </svg>
        </div>
      </div>

      {/* Rejected indicator */}
    </div>
  );
}
