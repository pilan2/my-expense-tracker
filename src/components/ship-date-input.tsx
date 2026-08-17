"use client";

import { useState } from "react";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900";

// 정확한 발송일을 모르고 "몇 월"까지만 아는 경우가 많아서, 하루 단위 입력과 월 단위 입력을
// 토글로 고를 수 있게 한다. 폼 제출 시 실제로 보이는 입력 하나만 값이 들어가므로, 서버에서는
// 어느 필드가 채워졌는지로 어떤 모드였는지 판단한다.
export function ShipDateInput({
  label = "예상 발송일",
  defaultDate,
  defaultMonth,
  defaultApprox = false,
}: {
  label?: string;
  defaultDate?: string;
  defaultMonth?: string;
  defaultApprox?: boolean;
}) {
  const [mode, setMode] = useState<"exact" | "month">(defaultApprox ? "month" : "exact");

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{label}</span>
        <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5 text-xs dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setMode("exact")}
            className={`rounded px-2 py-1 ${
              mode === "exact"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500"
            }`}
          >
            정확한 날짜
          </button>
          <button
            type="button"
            onClick={() => setMode("month")}
            className={`rounded px-2 py-1 ${
              mode === "month"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500"
            }`}
          >
            월만 알 때
          </button>
        </div>
      </div>
      {mode === "exact" ? (
        <input name="expectedShipDate" type="date" defaultValue={defaultDate} required className={inputClass} />
      ) : (
        <input name="expectedShipMonth" type="month" defaultValue={defaultMonth} required className={inputClass} />
      )}
    </div>
  );
}
