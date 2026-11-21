"use client";

import type { ItemView } from "@/lib/item-filter";

export function ItemViewToggle({ view, onChange }: { view: ItemView; onChange: (view: ItemView) => void }) {
  return (
    <div role="group" aria-label="보기 방식" className="flex shrink-0 rounded-xl bg-surface-soft p-1">
      {(["list", "grid"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={view === option}
          aria-label={option === "list" ? "목록 보기" : "사진 그리드 보기"}
          onClick={() => onChange(option)}
          className={`flex h-9 w-11 items-center justify-center rounded-lg ${view === option ? "bg-surface text-accent shadow-card" : "text-muted"}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={option === "list" ? "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" : "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"} />
          </svg>
        </button>
      ))}
    </div>
  );
}
