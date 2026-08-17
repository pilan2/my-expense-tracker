"use client";

import { useMemo, useState } from "react";

type ItemOption = { id: string; genre: string; character: string; detail: string };

export function AddGroupItemsForm({
  action,
  itemOptions,
}: {
  action: (formData: FormData) => void;
  itemOptions: ItemOption[];
}) {
  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredOptions = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return itemOptions;
    return itemOptions.filter((item) => `${item.genre} ${item.character} ${item.detail}`.toLowerCase().includes(q));
  }, [itemOptions, filter]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  if (itemOptions.length === 0) {
    return <p className="text-sm text-neutral-500">추가할 수 있는(아직 그룹에 없는 미현물) 품목이 없습니다.</p>;
  }

  return (
    <form
      action={(formData) => {
        action(formData);
        setSelectedIds([]);
        setFilter("");
      }}
      className="flex flex-col gap-2"
    >
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="품목 검색"
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800">
        {filteredOptions.length === 0 ? (
          <p className="p-2 text-xs text-neutral-500">일치하는 품목이 없습니다.</p>
        ) : (
          filteredOptions.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 border-b border-neutral-100 px-2 py-1.5 text-sm last:border-b-0 dark:border-neutral-900"
            >
              <input
                type="checkbox"
                name="itemIds"
                value={item.id}
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleItem(item.id)}
                className="h-5 w-5"
              />
              <span className="min-w-0 flex-1 truncate">
                {item.genre} · {item.character} · {item.detail}
              </span>
            </label>
          ))
        )}
      </div>
      <button
        type="submit"
        disabled={selectedIds.length === 0}
        className="self-start rounded-md border border-neutral-300 px-4 py-2 text-sm hover:opacity-70 disabled:opacity-40 dark:border-neutral-700"
      >
        선택한 품목 추가
      </button>
    </form>
  );
}
