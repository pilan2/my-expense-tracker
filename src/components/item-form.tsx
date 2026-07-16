"use client";

import { useState } from "react";
import { NumberInput } from "@/components/number-input";
import { ClearableDateInput } from "@/components/clearable-date-input";
import type { GenreCatalogEntry, ItemTypeCatalogEntry } from "@/lib/catalog";

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

// 카탈로그에 있는 값은 버튼으로 고르고, 없는 값이면(또는 "+ 직접 입력"을 누르면) 텍스트로 새로 입력한다.
// 필수가 아닌 필드는(required=false) 이미 선택된 버튼을 다시 누르면 선택이 해제된다.
function PickerField({
  label,
  name,
  options,
  value,
  onChange,
  required = true,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
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
              if (!required && !customMode && value === option) {
                onChange("");
                return;
              }
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
  genreCatalog,
  itemTypeCatalog,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  genreCatalog: GenreCatalogEntry[];
  itemTypeCatalog: ItemTypeCatalogEntry[];
  defaultValues?: Partial<ItemFormDefaults>;
}) {
  const [quantity, setQuantity] = useState(defaultValues?.quantity ?? 1);
  const [isPhysical, setIsPhysical] = useState(defaultValues?.isPhysical ?? false);
  const [genre, setGenre] = useState(defaultValues?.genre ?? "");
  const [character, setCharacter] = useState(defaultValues?.character ?? "");
  const [series, setSeries] = useState(defaultValues?.series ?? "");
  const [itemType, setItemType] = useState(defaultValues?.itemType ?? "");
  const [maker, setMaker] = useState(defaultValues?.maker ?? "");
  const [organizer, setOrganizer] = useState(defaultValues?.organizer ?? "");

  const selectedGenre = genreCatalog.find((g) => g.name === genre);
  const genreOptions = genreCatalog.map((g) => g.name);
  const characterOptions = selectedGenre?.characters.map((c) => c.name) ?? [];
  const seriesOptions = selectedGenre?.characters.find((c) => c.name === character)?.series.map((s) => s.name) ?? [];
  const itemTypeOptions = itemTypeCatalog.map((t) => t.name);
  const makerOptions = selectedGenre?.makers.map((m) => m.name) ?? [];
  const organizerOptions = selectedGenre?.organizers.map((o) => o.name) ?? [];

  // 장르가 바뀌면 그 장르에 속하지 않는 캐릭터/시리즈/제작자/공구자 선택은 의미가 없어지므로 초기화한다.
  function handleGenreChange(next: string) {
    setGenre(next);
    setCharacter("");
    setSeries("");
    setMaker("");
    setOrganizer("");
  }
  // 캐릭터가 바뀌면 그 캐릭터에 속하지 않는 시리즈 선택도 초기화한다.
  function handleCharacterChange(next: string) {
    setCharacter(next);
    setSeries("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!genre.trim() || !character.trim() || !itemType.trim()) {
      e.preventDefault();
      window.alert("장르, 캐릭터, 물품 종류를 입력해주세요.");
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PickerField label="장르" name="genre" options={genreOptions} value={genre} onChange={handleGenreChange} />
      <PickerField
        label="캐릭터"
        name="character"
        options={characterOptions}
        value={character}
        onChange={handleCharacterChange}
      />
      <PickerField
        label="시리즈 (선택, 예: 오리지널/리부트)"
        name="series"
        options={seriesOptions}
        value={series}
        onChange={setSeries}
        required={false}
      />
      <PickerField
        label="물품 종류 (대분류)"
        name="itemType"
        options={itemTypeOptions}
        value={itemType}
        onChange={setItemType}
      />

      <Field label="물품 세부사항">
        <input
          name="detail"
          defaultValue={defaultValues?.detail}
          required
          className={inputClass}
        />
      </Field>

      <Field label="구매일 (날짜 기반 통계에 사용 가능)">
        <ClearableDateInput
          name="purchasedAt"
          defaultValue={defaultValues?.purchasedAt ?? new Date().toISOString().slice(0, 10)}
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

      <PickerField
        label="제작한 사람 (선택)"
        name="maker"
        options={makerOptions}
        value={maker}
        onChange={setMaker}
        required={false}
      />

      <PickerField
        label="공구 개최한 사람 (선택)"
        name="organizer"
        options={organizerOptions}
        value={organizer}
        onChange={setOrganizer}
        required={false}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="hasOverseasShipping"
          defaultChecked={defaultValues?.hasOverseasShipping}
        />
        이후 배송비 계산 필요
      </label>

      <Field label="배송비 (만원 단위, 목록에서 여러 품목에 분배도 가능)">
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
