"use client";

import { useMemo, useState } from "react";

type ItemOption = {
  id: string;
  genre: string;
  character: string;
  detail: string;
  price: number;
  quantity: number;
};

export function ChecklistItemForm({
  action,
  itemOptions,
}: {
  action: (formData: FormData) => void;
  itemOptions: ItemOption[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const filteredOptions = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return itemOptions;
    return itemOptions.filter((item) =>
      `${item.genre} ${item.character} ${item.detail}`.toLowerCase().includes(q),
    );
  }, [itemOptions, filter]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  const hasSelection = selectedIds.length > 0;

  return (
    <form
      action={(formData) => {
        action(formData);
        setSelectedIds([]);
        setFilter("");
        setLabel("");
        setPrice("");
        setQuantity("");
      }}
      className="mb-8 flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div className="flex gap-2">
        <input
          name="booth"
          placeholder="부스 (예: A-12)"
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <select
          name="type"
          defaultValue="PICKUP"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="PICKUP">수령</option>
          <option value="PURCHASE">구매</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="품목과 연결 (검색해서 여러 개 선택 가능)"
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
        {hasSelection && (
          <p className="text-xs text-neutral-500">
            {selectedIds.length}개 품목 선택됨 — 각 품목의 이름/가격/수량으로 자동 등록됩니다.
          </p>
        )}
      </div>

      {!hasSelection && (
        <>
          <input
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="품목 이름 (품목을 연결하지 않을 때만 직접 입력)"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <div className="flex gap-2">
            <input
              name="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="가격 (만원 단위)"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              name="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="수량"
              className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
      >
        체크리스트에 추가
      </button>
    </form>
  );
}
