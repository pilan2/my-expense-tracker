"use client";

import { useState } from "react";
import { wonToManwon } from "@/lib/money";

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
  const [itemId, setItemId] = useState("");
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  function handleItemChange(nextId: string) {
    setItemId(nextId);
    const item = itemOptions.find((i) => i.id === nextId);
    if (item) {
      setLabel(`${item.genre} · ${item.character} · ${item.detail}`);
      setPrice(wonToManwon(item.price));
      setQuantity(String(item.quantity));
    }
  }

  return (
    <form
      action={(formData) => {
        action(formData);
        setItemId("");
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
      <select
        name="itemId"
        value={itemId}
        onChange={(e) => handleItemChange(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">품목과 연결 (선택 안 함)</option>
        {itemOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.genre} · {item.character} · {item.detail}
          </option>
        ))}
      </select>
      <input
        name="label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="품목 이름 (품목을 연결하면 자동 채움)"
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
      <button
        type="submit"
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
      >
        체크리스트에 추가
      </button>
    </form>
  );
}
