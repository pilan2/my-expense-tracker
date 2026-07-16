"use client";

import { useRef } from "react";

// 날짜를 모를 때 연/월/일을 하나씩 지우지 않고 "모름" 버튼 한 번으로 비울 수 있게 한다.
export function ClearableDateInput({
  name,
  defaultValue,
  className,
}: {
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} name={name} type="date" defaultValue={defaultValue} className={className} />
      <button
        type="button"
        onClick={() => {
          if (inputRef.current) inputRef.current.value = "";
        }}
        className="shrink-0 rounded-md border border-neutral-300 px-2 py-1.5 text-xs text-neutral-500 hover:opacity-70 dark:border-neutral-700"
      >
        모름
      </button>
    </div>
  );
}
