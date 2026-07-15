"use client";

import { useState } from "react";
import type { MonthlyPoint } from "@/lib/trends";
import { formatMonth, formatWon } from "@/lib/chart-format";

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 8, left: 12 };

export function TrendLineChart({ points: data }: { points: MonthlyPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-500">데이터가 없습니다.</p>;
  }

  const maxValue = Math.max(1, ...data.flatMap((d) => [d.purchaseTotal, d.saleTotal]));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (i: number) => (data.length <= 1 ? PADDING.left : PADDING.left + (i / (data.length - 1)) * innerWidth);
  const y = (v: number) => PADDING.top + innerHeight - (v / maxValue) * innerHeight;

  const purchasePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.purchaseTotal)}`).join(" ");
  const salePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.saleTotal)}`).join(" ");

  const lastIndex = data.length - 1;
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const activeIndex = hoverIndex ?? lastIndex;

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    data.forEach((_, i) => {
      const dist = Math.abs(x(i) - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const activePoint = data[activeIndex];
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

        <path
          d={purchasePath}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-[#2a78d6] dark:stroke-[#3987e5]"
        />
        <path d={salePath} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="stroke-[#008300]" />

        <circle
          cx={x(activeIndex)}
          cy={y(activePoint.purchaseTotal)}
          r={4}
          strokeWidth={2}
          className="fill-[#2a78d6] stroke-white dark:fill-[#3987e5] dark:stroke-neutral-900"
        />
        <circle
          cx={x(activeIndex)}
          cy={y(activePoint.saleTotal)}
          r={4}
          strokeWidth={2}
          className="fill-[#008300] stroke-white dark:stroke-neutral-900"
        />
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-max rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          style={{
            ...(tooltipLeftPercent > 60
              ? { right: `${100 - tooltipLeftPercent}%` }
              : { left: `${tooltipLeftPercent}%` }),
          }}
        >
          <p className="mb-1 font-medium text-neutral-900 dark:text-neutral-100">{formatMonth(hovered.month)}</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 shrink-0 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]" />
            <span className="text-neutral-500">구매</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{formatWon(hovered.purchaseTotal)}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 shrink-0 rounded-full bg-[#008300]" />
            <span className="text-neutral-500">판매</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{formatWon(hovered.saleTotal)}</span>
          </p>
        </div>
      )}

      <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
        <span>{formatMonth(data[0].month)}</span>
        <span>{formatMonth(data[lastIndex].month)}</span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]" />
          <span className="text-neutral-500">구매</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full bg-[#008300]" />
          <span className="text-neutral-500">판매</span>
        </span>
      </div>
    </div>
  );
}
