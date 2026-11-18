"use client";

import { useState, type InputHTMLAttributes } from "react";
import { NumberInput } from "@/components/number-input";
import { manwonToWon, won } from "@/lib/money";

// 금액은 만원 단위로 입력받으므로(1.5 = 15,000원), 입력칸 바로 아래에 원 단위 환산을 보여줘
// 자릿수 실수를 저장 전에 알아챌 수 있게 한다.
export function ManwonInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [typed, setTyped] = useState(String(props.defaultValue ?? ""));
  const current = props.value !== undefined ? String(props.value) : typed;
  const amount = Number(current);
  const hint = current.trim() && Number.isFinite(amount) && amount >= 0 ? `= ${won(Number(manwonToWon(current)))}` : "";
  return (
    <>
      <NumberInput
        min={0}
        step={0.0001}
        {...props}
        onChange={(event) => { setTyped(event.target.value); props.onChange?.(event); }}
      />
      <span aria-live="polite" className="block min-h-4 text-xs text-neutral-500">{hint}</span>
    </>
  );
}
