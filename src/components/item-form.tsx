"use client";

import { useState } from "react";
import { NumberInput } from "@/components/number-input";
import type { GenreCatalogEntry } from "@/lib/catalog";

type Suggestions = {
  series: string[];
  itemTypes: string[];
};

export type ItemFormDefaults = {
  genre: string;
  character: string;
  series: string;
  itemType: string;
  detail: string;
  quantity: number;
  price: string;
  purchasedAt: string;
  shippingFee: string;
  hasOverseasShipping: boolean;
  maker: string;
  organizer: string;
  isPhysical: boolean;
  expectedShipDate: string;
};

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900";

const pickerButtonClass = (selected: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm ${
    selected
      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
      : "border-neutral-300 dark:border-neutral-700"
  }`;

// 장르/캐릭터를 버튼으로 고르되, 카탈로그에 없는 값이면(또는 "+ 직접 입력"을 누르면)
// 텍스트로 새로 입력할 수 있게 한다.
function PickerField({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [customMode, setCustomMode] = useState(Boolean(value) && !options.includes(value));

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setCustomMode(false);
              onChange(option);
            }}
            className={pickerButtonClass(!customMode && value === option)}
          >
            {option}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setCustomMode(true);
            onChange("");
          }}
          className={`rounded-full border border-dashed px-3 py-1.5 text-sm ${
            customMode ? "border-neutral-900 dark:border-neutral-100" : "border-neutral-400 text-neutral-500 dark:border-neutral-600"
          }`}
        >
          + 직접 입력
        </button>
      </div>
      {customMode && (
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${label} 직접 입력`}
          className={inputClass}
        />
      )}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export function ItemForm({
  action,
  suggestions,
  genreCatalog,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  suggestions: Suggestions;
  genreCatalog: GenreCatalogEntry[];
  defaultValues?: Partial<ItemFormDefaults>;
}) {
  const [quantity, setQuantity] = useState(defaultValues?.quantity ?? 1);
  const [isPhysical, setIsPhysical] = useState(defaultValues?.isPhysical ?? false);
  const [genre, setGenre] = useState(defaultValues?.genre ?? "");
  const [character, setCharacter] = useState(defaultValues?.character ?? "");

  const genreOptions = genreCatalog.map((g) => g.name);
  const characterOptions = genreCatalog.find((g) => g.name === genre)?.characters.map((c) => c.name) ?? [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!genre.trim() || !character.trim()) {
      e.preventDefault();
      window.alert("장르와 캐릭터를 입력해주세요.");
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PickerField label="장르" name="genre" options={genreOptions} value={genre} onChange={setGenre} />
      <PickerField label="캐릭터" name="character" options={characterOptions} value={character} onChange={setCharacter} />

      <Field label="시리즈 (선택, 예: 오리지널/리부트)">
        <input
          name="series"
          list="series-list"
          defaultValue={defaultValues?.series}
          className={inputClass}
        />
        <datalist id="series-list">
          {suggestions.series.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </Field>

      <Field label="물품 종류 (대분류)">
        <input
          name="itemType"
          list="itemType-list"
          defaultValue={defaultValues?.itemType}
          required
          className={inputClass}
        />
        <datalist id="itemType-list">
          {suggestions.itemTypes.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>

      <Field label="물품 세부사항">
        <input
          name="detail"
          defaultValue={defaultValues?.detail}
          required
          className={inputClass}
        />
      </Field>

      <Field label="구매일">
        <input
          name="purchasedAt"
          type="date"
          defaultValue={defaultValues?.purchasedAt ?? new Date().toISOString().slice(0, 10)}
          required
          className={inputClass}
        />
      </Field>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">수량</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-lg dark:border-neutral-700"
          >
            −
          </button>
          <NumberInput
            name="quantity"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className={`${inputClass} w-20 text-center`}
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-lg dark:border-neutral-700"
          >
            +
          </button>
        </div>
      </div>

      <Field label="가격 (만원 단위, 예: 1.5 = 15,000원)">
        <NumberInput
          name="price"
          min={0}
          step={0.0001}
          defaultValue={defaultValues?.price}
          required
          className={inputClass}
        />
      </Field>

      <Field label="제작한 사람 (선택)">
        <input name="maker" defaultValue={defaultValues?.maker} className={inputClass} />
      </Field>

      <Field label="공구 개최한 사람 (선택)">
        <input name="organizer" defaultValue={defaultValues?.organizer} className={inputClass} />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="hasOverseasShipping"
          defaultChecked={defaultValues?.hasOverseasShipping}
        />
        이후 해외배송비 존재
      </label>

      <Field label="배송비 (만원 단위, 확정된 경우만 - 목록에서 여러 품목에 자동 분배도 가능)">
        <NumberInput
          name="shippingFee"
          min={0}
          // 자동 분배는 원 단위까지 정확하게 나누므로(1원 = 0.0001만원), 수기 입력도 같은 정밀도를 허용한다.
          step={0.0001}
          defaultValue={defaultValues?.shippingFee ?? "0"}
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPhysical"
          checked={isPhysical}
          onChange={(e) => setIsPhysical(e.target.checked)}
        />
        현물로 보유 중
      </label>

      {!isPhysical && (
        <Field label="예상 발송일">
          <input
            name="expectedShipDate"
            type="date"
            defaultValue={defaultValues?.expectedShipDate}
            required
            className={inputClass}
          />
        </Field>
      )}

      <button
        type="submit"
        className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
      >
        저장
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
