import Link from "@/lib/local/navigation";
import { currentData } from "@/lib/local/database";
import { currentMonth, monthBudget, remainingText, won } from "@/lib/budget";

export function BudgetSummary({ month = currentMonth(), link = true }: { month?: string; link?: boolean }) {
  const budget = monthBudget(currentData(), month);
  const ratio = budget.amount === null || budget.amount === 0 ? null : budget.spent / budget.amount;
  const exceeded = budget.remaining !== null && budget.remaining < 0;
  return <section aria-label="월별 예산 현황" className="space-y-3 rounded-lg border border-neutral-300 p-4 dark:border-neutral-700">
    <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{month} 예산</h2>{link && <Link href={`/budget?month=${month}`} className="text-sm underline">예산·구매 후보 관리</Link>}</div>
    {budget.amount === null ? <p>예산을 설정하면 남은 금액을 확인할 수 있어요.</p> : <>
      <p className="text-sm">예산 {won(budget.amount)} · 사용 {won(budget.spent)}</p>
      <p className={`text-lg font-semibold ${exceeded ? "text-red-600" : ""}`}>{remainingText(budget.remaining!)}</p>
      <progress aria-label="예산 사용률" max={100} value={budget.amount === 0 ? (budget.spent ? 100 : 0) : Math.min(100, ratio! * 100)} className="h-3 w-full accent-blue-600" />
      <p className="text-sm">{ratio === null ? "이번 달은 지출 없는 달로 설정했어요." : `예산의 ${Math.round(ratio * 100)}% 사용`}{exceeded ? " · 예산을 초과했어요." : ratio !== null && ratio >= 0.8 ? " · 예산을 80% 이상 사용했어요." : ""}</p>
    </>}
    {budget.amount === null && <p className="text-sm">사용 {won(budget.spent)}</p>}
    {budget.undated > 0 && <p className="text-sm text-amber-700 dark:text-amber-400">구매일 없는 품목 {budget.undated}개는 월별 계산에서 제외됩니다.</p>}
    {budget.pendingShipping > 0 && <p className="text-sm text-amber-700 dark:text-amber-400">이번 달 품목 {budget.pendingShipping}개는 배송비가 추가될 수 있어요.</p>}
  </section>;
}
