"use client";
import { useState } from "react";
import Link, { useRouter } from "@/lib/local/navigation";
import { currentData } from "@/lib/local/database";
import { isBudgetMonth, type Wish } from "@/lib/local/models";
import { currentMonth, monthBudget, remainingText, wishCost, won } from "@/lib/budget";
import { wonToManwon } from "@/lib/money";
import { saveBudget, resetMonthlyBudget, saveWish, deleteWish } from "@/lib/actions/budget";
import { BudgetSummary } from "@/components/budget-summary";
import { LocalForm } from "@/components/local-form";
import { BackButton } from "@/components/back-button";

const input = "min-w-0 w-full rounded border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-900";
const button = "rounded bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900";

function WishForm({ wish, month, done }: { wish?: Wish; month: string; done: () => void }) {
  return <LocalForm action={async form => { await saveWish(wish?.id ?? null, form); done(); }} className="grid gap-3 text-sm">
    <label>후보 이름<input name="title" required defaultValue={wish?.title} className={input} /></label>
    <label>구매 예정 월<input name="month" type="month" required defaultValue={wish?.month ?? month} className={input} /></label>
    <label>예상 단가 (만원)<input name="price" type="number" min="0" step="0.0001" required defaultValue={wish ? wonToManwon(wish.price) : ""} className={input} /></label>
    <label>예상 수량<input name="quantity" type="number" min="1" step="1" required defaultValue={wish?.quantity ?? 1} className={input} /></label>
    <label>예상 배송비 (만원)<input name="shippingFee" type="number" min="0" step="0.0001" required defaultValue={wish ? wonToManwon(wish.shippingFee) : "0"} className={input} /></label>
    <label>사고 싶은 이유<textarea name="reason" defaultValue={wish?.reason ?? ""} rows={2} className={input} /></label>
    <label>우선순위<select name="priority" defaultValue={wish?.priority ?? 2} className={input}><option value="1">1 · 꼭 사고 싶음</option><option value="2">2 · 고민 중</option><option value="3">3 · 여유가 있으면</option></select></label>
    <label>판매 마감일 (선택)<input name="deadline" type="date" defaultValue={wish?.deadline?.toISOString().slice(0, 10) ?? ""} className={input} /></label>
    <label>구매처 링크 (선택)<input name="purchaseLink" type="url" defaultValue={wish?.purchaseLink ?? ""} className={input} /></label>
    <button className={button} type="submit">{wish ? "후보 수정 저장" : "후보 저장"}</button>
  </LocalForm>;
}
export default function BudgetPage({ searchParams }: { searchParams: { month?: string } }) {
  const month = searchParams.month && isBudgetMonth(searchParams.month) ? searchParams.month : currentMonth();
  const router = useRouter(), data = currentData();
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const summary = monthBudget(data, month);
  const wishes = data.wish.filter(row => row.month === month);
  const pending = wishes.filter(row => row.status === "pending").sort((a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime());
  const purchased = wishes.filter(row => row.status === "purchased");
  const projected = pending.filter(row => selected.includes(row.id)).reduce((sum, row) => sum + wishCost(row), 0);
  const override = data.monthlyBudget.find(row => row.id === month);
  const rule = data.budgetRule.filter(row => row.id <= month).sort((a, b) => b.id.localeCompare(a.id))[0];
  return <div className="mx-auto max-w-2xl space-y-6 p-6">
    <BackButton href="/" /><h1 className="text-xl font-semibold">월별 예산과 구매 후보</h1>
    <label className="block text-sm">확인할 월<input aria-label="확인할 월" type="month" value={month} onChange={event => { if (isBudgetMonth(event.target.value)) router.push(`/budget?month=${event.target.value}`); }} className={input} /></label>
    <BudgetSummary month={month} link={false} />
    <p className="text-sm text-neutral-500">구매일 기준으로 단가 × 수량 + 배송비를 계산합니다. 판매 수입과 남은 예산은 다음 예산에 더하지 않습니다. 행사 체크리스트는 중복 합산하지 않으며, 실제 구매는 품목으로 등록해주세요.</p>
    <details className="rounded border border-neutral-300 p-4 dark:border-neutral-700" open={summary.amount === null}>
      <summary className="cursor-pointer font-medium">예산 설정</summary>
      <div className="mt-4 space-y-5">
        <LocalForm key={`override-${month}-${override?.amount}`} action={async form => { await saveBudget(form); setMessage(`${month} 예산을 저장했습니다.`); }} className="space-y-2 text-sm">
          <input type="hidden" name="month" value={month} /><input type="hidden" name="mode" value="month" />
          <label className="block">이 달만 사용할 예산 (만원)<input name="amount" type="number" min="0" step="0.0001" required defaultValue={summary.amount === null ? "" : wonToManwon(summary.amount)} className={input} /></label>
          <button className={button}>이 달 예산 저장</button>
        </LocalForm>
        {override && <LocalForm action={async () => { await resetMonthlyBudget(month); setMessage("이 달의 별도 예산을 해제했습니다."); }}><button className="text-sm underline">이 달 별도 예산 해제</button></LocalForm>}
        {month >= currentMonth() && <LocalForm key={`default-${month}-${rule?.amount}`} action={async form => { await saveBudget(form); setMessage(`${month}부터 적용할 기본 예산을 저장했습니다.`); }} className="space-y-2 text-sm">
          <input type="hidden" name="month" value={month} /><input type="hidden" name="mode" value="default" />
          <label className="block">이 달부터 적용할 기본 월 예산 (만원)<input name="amount" type="number" min="0" step="0.0001" required defaultValue={rule ? wonToManwon(rule.amount) : ""} className={input} /></label>
          <p>과거 달은 유지합니다. 달별 별도 예산과 이미 예약한 미래 기본 예산이 있으면 그 설정이 우선합니다.</p>
          <button className={button}>기본 예산 저장</button>
        </LocalForm>}
        {data.budgetRule.length > 0 && <ul className="text-sm">{[...data.budgetRule].sort((a, b) => a.id.localeCompare(b.id)).map(row => <li key={row.id}>{row.id}부터 기본 {won(row.amount)}</li>)}</ul>}
      </div>
    </details>
    {message && <p role="status" className="text-sm">{message}</p>}
    <section className="space-y-4" aria-label="구매 후보">
      <div className="flex items-center justify-between"><h2 className="font-semibold">구매 후보</h2><button className="text-sm underline" onClick={() => setCreating(!creating)}>{creating ? "입력 닫기" : "후보 추가"}</button></div>
      <p className="text-sm">사기 전에 이유와 우선순위를 적어보세요. 구매 후보는 아직 지출에 포함되지 않습니다.</p>
      {creating && <WishForm month={month} done={() => { setCreating(false); setMessage("구매 후보를 저장했습니다."); }} />}
      <div className="rounded bg-neutral-100 p-3 text-sm dark:bg-neutral-800" aria-live="polite">
        <p>선택한 후보 예상 지출 {won(projected)}</p>
        <p>{summary.remaining === null ? "예산을 설정하면 구매 후 잔액을 볼 수 있어요." : `선택한 후보를 모두 사면 ${remainingText(summary.remaining - projected)}`}</p>
      </div>
      {!pending.length && <p className="text-sm text-neutral-500">이 달의 구매 후보가 없습니다.</p>}
      {pending.map(wish => <article key={wish.id} className="space-y-3 rounded border border-neutral-300 p-4 dark:border-neutral-700">
        <label className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(wish.id)} onChange={event => setSelected(event.target.checked ? [...selected, wish.id] : selected.filter(id => id !== wish.id))} />{wish.title}</label>
        <p className="text-sm">우선순위 {wish.priority} · 예상 {won(wishCost(wish))} ({wish.quantity}개, 배송비 포함)</p>
        {wish.reason && <p className="whitespace-pre-wrap text-sm">사고 싶은 이유: {wish.reason}</p>}
        {wish.deadline && <p className="text-sm">판매 마감 {wish.deadline.toISOString().slice(0, 10)}</p>}
        {wish.purchaseLink && <a href={wish.purchaseLink} target="_blank" rel="noreferrer" className="text-sm underline">구매처 열기</a>}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href={`/items/new?wish=${encodeURIComponent(wish.id)}`} className="underline">구매하고 품목 등록</Link>
          <button onClick={() => setEditing(editing === wish.id ? null : wish.id)} className="underline">{editing === wish.id ? "수정 닫기" : "수정"}</button>
          <LocalForm action={async () => { if (window.confirm(`"${wish.title}" 후보를 삭제할까요?`)) await deleteWish(wish.id); }}><button className="text-red-600">후보 삭제</button></LocalForm>
        </div>
        {editing === wish.id && <WishForm wish={wish} month={month} done={() => { setEditing(null); setMessage("구매 후보를 수정했습니다."); }} />}
      </article>)}
      {purchased.length > 0 && <details><summary>구매 완료한 후보 {purchased.length}개</summary><ul className="mt-2 space-y-2 text-sm">{purchased.map(wish => <li key={wish.id}>{wish.title} · {wish.itemId ? <Link className="underline" href={`/items/${wish.itemId}`}>등록한 품목 보기</Link> : "등록한 품목 삭제됨"}</li>)}</ul></details>}
    </section>
  </div>;
}
