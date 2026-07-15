"use client";

import { useState } from "react";
import type { GenreComparisonSeries } from "@/lib/trends";
import { formatMonth, formatWon } from "@/lib/chart-format";

const WIDTH = 600;
const HEIGHT = 240;
const PADDING = { top: 16, right: 12, bottom: 8, left: 12 };

// 팔레트 고정 순서(8색) — 슬롯 순서는 항상 동일하게, 개별 장르에 배정만 다르게 한다.
const STROKE_CLASSES = [
  "stroke-[#2a78d6] dark:stroke-[#3987e5]",
  "stroke-[#008300]",
  "stroke-[#e87ba4] dark:stroke-[#d55181]",
  "stroke-[#eda100] dark:stroke-[#c98500]",
  "stroke-[#1baf7a] dark:stroke-[#199e70]",
  "stroke-[#eb6834] dark:stroke-[#d95926]",
  "stroke-[#4a3aa7] dark:stroke-[#9085e9]",
  "stroke-[#e34948] dark:stroke-[#e66767]",
];
const FILL_CLASSES = [
  "fill-[#2a78d6] dark:fill-[#3987e5]",
  "fill-[#008300]",
  "fill-[#e87ba4] dark:fill-[#d55181]",
  "fill-[#eda100] dark:fill-[#c98500]",
  "fill-[#1baf7a] dark:fill-[#199e70]",
  "fill-[#eb6834] dark:fill-[#d95926]",
  "fill-[#4a3aa7] dark:fill-[#9085e9]",
  "fill-[#e34948] dark:fill-[#e66767]",
];
const BG_CLASSES = [
  "bg-[#2a78d6] dark:bg-[#3987e5]",
  "bg-[#008300]",
  "bg-[#e87ba4] dark:bg-[#d55181]",
  "bg-[#eda100] dark:bg-[#c98500]",
  "bg-[#1baf7a] dark:bg-[#199e70]",
  "bg-[#eb6834] dark:bg-[#d95926]",
  "bg-[#4a3aa7] dark:bg-[#9085e9]",
  "bg-[#e34948] dark:bg-[#e66767]",
];

export function GenreComparisonChart({ months, series }: { months: string[]; series: GenreComparisonSeries[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (months.length === 0 || series.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-500">데이터가 없습니다.</p>;
  }

  const maxValue = Math.max(1, ...series.flatMap((s) => s.values));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (i: number) => (months.length <= 1 ? PADDING.left : PADDING.left + (i / (months.length - 1)) * innerWidth);
  const y = (v: number) => PADDING.top + innerHeight - (v / maxValue) * innerHeight;

  const lastIndex = months.length - 1;
  const activeIndex = hoverIndex ?? lastIndex;

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    months.forEach((_, i) => {
      const dist = Math.abs(x(i) - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const tooltipLeftPercent = (x(activeIndex) / WIDTH) * 100;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PADDING.left}
          y1={y(0)}
          x2={WIDTH - PADDING.right}
          y2={y(0)}
          strokeWidth={1}
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />
        <line
          x1={x(activeIndex)}
          y1={PADDING.top}
          x2={x(activeIndex)}
          y2={HEIGHT - PADDING.bottom}
          strokeWidth={1}
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />

        {series.map((s, idx) => (
          <path
            key={s.genre}
            d={s.values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ")}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={STROKE_CLASSES[idx % STROKE_CLASSES.length]}
          />
        ))}

        {series.map((s, idx) => (
          <circle
            key={s.genre}
            cx={x(activeIndex)}
            cy={y(s.values[activeIndex])}
            r={4}
            strokeWidth={2}
            className={`${FILL_CLASSES[idx % FILL_CLASSES.length]} stroke-white dark:stroke-neutral-900`}
          />
        ))}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-max rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          style={{
            ...(tooltipLeftPercent > 60
              ? { right: `${100 - tooltipLeftPercent}%` }
              : { left: `${tooltipLeftPercent}%` }),
          }}
        >
          <p className="mb-1 font-medium text-neutral-900 dark:text-neutral-100">{formatMonth(months[activeIndex])}</p>
          {series.map((s, idx) => (
            <p key={s.genre} className="flex items-center gap-1.5">
              <span className={`inline-block h-0.5 w-3 shrink-0 rounded-full ${BG_CLASSES[idx % BG_CLASSES.length]}`} />
              <span className="text-neutral-500">{s.genre}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{formatWon(s.values[activeIndex])}</span>
            </p>
          ))}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
        <span>{formatMonth(months[0])}</span>
        <span>{formatMonth(months[lastIndex])}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {series.map((s, idx) => (
          <span key={s.genre} className="flex items-center gap-1.5">
            <span className={`inline-block h-0.5 w-3 rounded-full ${BG_CLASSES[idx % BG_CLASSES.length]}`} />
            <span className="text-neutral-500">{s.genre}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
