"use client";

import { useState } from "react";

type Suggestions = {
  genres: string[];
  characters: string[];
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
  hasOverseasShipping: boolean;
  maker: string;
  organizer: string;
  isPhysical: boolean;
  expectedShipDate: string;
};

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900";

export function ItemForm({
  action,
  suggestions,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  suggestions: Suggestions;
  defaultValues?: Partial<ItemFormDefaults>;
}) {
  const [quantity, setQuantity] = useState(defaultValues?.quantity ?? 1);
  const [isPhysical, setIsPhysical] = useState(defaultValues?.isPhysical ?? false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="장르">
        <input
          name="genre"
          list="genre-list"
          defaultValue={defaultValues?.genre}
          required
          className={inputClass}
        />
        <datalist id="genre-list">
          {suggestions.genres.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </Field>

      <Field label="캐릭터">
        <input
          name="character"
          list="character-list"
          defaultValue={defaultValues?.character}
          required
          className={inputClass}
        />
        <datalist id="character-list">
          {suggestions.characters.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

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
          <input
            name="quantity"
            type="number"
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
        <input
          name="price"
          type="number"
          min={0}
          step={0.01}
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
