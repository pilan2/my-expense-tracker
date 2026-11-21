"use client";
import { useState } from "react";
import { useRouter } from "@/lib/local/navigation";
import { currentData } from "@/lib/local/database";
import { isBudgetMonth } from "@/lib/local/models";
import { currentMonth, monthBudget, won } from "@/lib/budget";
import { wonToManwon } from "@/lib/money";
import { saveBudget, resetMonthlyBudget } from "@/lib/actions/budget";
import { BudgetSummary } from "@/components/budget-summary";
import { LocalForm } from "@/components/local-form";
import { BackButton } from "@/components/back-button";
import { buttonClass, inputClass, linkClass } from "@/components/ui";
import { ManwonInput } from "@/components/manwon-input";

const input = `${inputClass} w-full`;
const button = buttonClass();

export default function BudgetPage({ searchParams }: { searchParams: { month?: string } }) {
  const month = searchParams.month && isBudgetMonth(searchParams.month) ? searchParams.month : currentMonth();
  const router = useRouter(), data = currentData();
  const [message, setMessage] = useState("");
  const summary = monthBudget(data, month);
  const override = data.monthlyBudget.find(row => row.id === month);
  const rule = data.budgetRule.filter(row => row.id <= month).sort((a, b) => b.id.localeCompare(a.id))[0];
  return <div className="mx-auto max-w-2xl space-y-6 p-6">
    <BackButton href="/" /><h1 className="text-2xl font-bold">월별 예산</h1>
    <label className="block text-sm">확인할 월<input aria-label="확인할 월" type="month" value={month} onChange={event => { if (isBudgetMonth(event.target.value)) router.push(`/budget?month=${event.target.value}`); }} className={input} /></label>
    <BudgetSummary month={month} link={false} />
    <details className="rounded-2xl border border-line bg-surface p-4 shadow-card" open={summary.amount === null}>
      <summary className="cursor-pointer font-medium">예산 설정</summary>
      <div className="mt-4 space-y-5">
        <LocalForm key={`override-${month}-${override?.amount}`} action={async form => { await saveBudget(form); setMessage(`${month} 예산을 저장했습니다.`); }} className="space-y-2 text-sm">
          <input type="hidden" name="month" value={month} /><input type="hidden" name="mode" value="month" />
          <label className="block">이 달만 사용할 예산 (만원)<ManwonInput name="amount" required defaultValue={summary.amount === null ? "" : wonToManwon(summary.amount)} className={input} /></label>
          <button className={button}>이 달 예산 저장</button>
        </LocalForm>
        {override && <LocalForm action={async () => { await resetMonthlyBudget(month); setMessage("이 달의 별도 예산을 해제했습니다."); }}><button className={linkClass}>이 달 별도 예산 해제</button></LocalForm>}
        {month >= currentMonth() && <LocalForm key={`default-${month}-${rule?.amount}`} action={async form => { await saveBudget(form); setMessage(`${month}부터 적용할 기본 예산을 저장했습니다.`); }} className="space-y-2 text-sm">
          <input type="hidden" name="month" value={month} /><input type="hidden" name="mode" value="default" />
          <label className="block">이 달부터 적용할 기본 월 예산 (만원)<ManwonInput name="amount" required defaultValue={rule ? wonToManwon(rule.amount) : ""} className={input} /></label>
          <button className={button}>기본 예산 저장</button>
        </LocalForm>}
        {data.budgetRule.length > 0 && <ul className="text-sm">{[...data.budgetRule].sort((a, b) => a.id.localeCompare(b.id)).map(row => <li key={row.id}>{row.id}부터 기본 {won(row.amount)}</li>)}</ul>}
      </div>
    </details>
    {message && <p role="status" className="text-sm">{message}</p>}
  </div>;
}
