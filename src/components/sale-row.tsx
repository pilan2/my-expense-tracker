"use client";

import { useState } from "react";
import { LocalForm } from "@/components/local-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { NumberInput } from "@/components/number-input";
import { ManwonInput } from "@/components/manwon-input";
import { ClearableDateInput } from "@/components/clearable-date-input";
import { updateSale, deleteSale } from "@/lib/actions/sales";
import { won, wonToManwon } from "@/lib/money";
import { buttonClass, inputClass } from "@/components/ui";
import { formatDate } from "@/lib/dday";

// 판매 기록 한 줄. 잘못 입력한 금액·날짜·수량을 삭제 후 재입력하지 않고 바로 고친다.
export function SaleRow({ sale, maxQuantity }: {
  sale: { id: string; quantitySold: number; saleAmount: number; saleDate: Date | null };
  maxQuantity: number;
}) {
  const [editing, setEditing] = useState(false);
  const label = `${sale.saleDate ? formatDate(sale.saleDate) : "날짜 모름"} · ${sale.quantitySold}개 · ${won(sale.saleAmount)}`;
  if (editing) {
    return (
      <li className="py-2">
        <LocalForm
          action={async (form) => { await updateSale(sale.id, form); setEditing(false); }}
          aria-label="판매 기록 수정"
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1">
            <span className="font-medium">판매 수량 (최대 {maxQuantity}개)</span>
            <NumberInput name="quantitySold" min={1} max={maxQuantity} defaultValue={sale.quantitySold} required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">판매 금액 (만원, 총액)</span>
            <ManwonInput name="saleAmount" defaultValue={wonToManwon(sale.saleAmount)} required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">판매일</span>
            <ClearableDateInput name="saleDate" defaultValue={sale.saleDate ? sale.saleDate.toISOString().slice(0, 10) : ""} className={inputClass} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass()}>수정 저장</button>
            <button type="button" onClick={() => setEditing(false)} className={buttonClass("secondary")}>취소</button>
          </div>
        </LocalForm>
      </li>
    );
  }
  return (
    <li className="flex items-center justify-between gap-2 py-1">
      <span>{label}</span>
      <span className="flex shrink-0">
        <button type="button" onClick={() => setEditing(true)} aria-label={`${label} 수정`} className={buttonClass("ghost")}>수정</button>
        <LocalForm action={deleteSale.bind(null, sale.id)}>
          <ConfirmSubmitButton confirmMessage="이 판매 기록을 삭제할까요?" className={buttonClass("dangerGhost")}>
            삭제
          </ConfirmSubmitButton>
        </LocalForm>
      </span>
    </li>
  );
}
