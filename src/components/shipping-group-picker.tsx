"use client";

import { useState } from "react";
import Link from "@/lib/local/navigation";
import { LocalForm } from "@/components/local-form";
import { setItemShippingGroup } from "@/lib/actions/shipping-groups";
import { buttonClass, inputClass } from "@/components/ui";

// 자동으로 못 묶은 통합 배송 등은 품목 화면에서 직접 그룹을 고르거나 새로 만든다.
export function ShippingGroupPicker({ itemId, current, groups }: {
  itemId: string;
  current: { id: string; label: string } | null;
  groups: { id: string; label: string; count: number }[];
}) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <span className="flex flex-wrap items-center gap-x-3">
        {current ? <Link href={`/shipping-groups/${current.id}`} className="text-accent-ink underline">{current.label} →</Link> : <span className="text-muted">없음</span>}
        <button type="button" onClick={() => setEditing(true)} className={buttonClass("ghost")}>바꾸기</button>
      </span>
    );
  }
  return (
    <LocalForm action={async (form) => { await setItemShippingGroup(itemId, form); setEditing(false); }} className="flex flex-col gap-2">
      <select name="shippingGroupId" aria-label="발송 그룹 선택" defaultValue={current?.id ?? ""} className={inputClass}>
        <option value="">그룹 없음</option>
        {groups.map((group) => <option key={group.id} value={group.id}>{group.label} ({group.count}개)</option>)}
        <option value="new">+ 이 품목으로 새 그룹 만들기</option>
      </select>
      <div className="flex gap-2">
        <button type="submit" className={buttonClass()}>저장</button>
        <button type="button" onClick={() => setEditing(false)} className={buttonClass("secondary")}>취소</button>
      </div>
    </LocalForm>
  );
}
