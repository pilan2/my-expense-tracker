import Link from "@/lib/local/navigation";
import { currentData } from "@/lib/local/database";
import { currentMonth, monthBudget, remainingText, won } from "@/lib/budget";
import { linkClass } from "@/components/ui";

// 이번 달에 가장 궁금한 "얼마 남았나"를 크게, 예산·사용액은 작은 보조 줄로 보여준다.
export function BudgetSummary({ month = currentMonth(), link = true }: { month?: string; link?: boolean }) {
  const budget = monthBudget(currentData(), month);
  const ratio = budget.amount === null || budget.amount === 0 ? null : budget.spent / budget.amount;
  const exceeded = budget.remaining !== null && budget.remaining < 0;
  const percent = budget.amount === 0 ? (budget.spent ? 100 : 0) : Math.min(100, (ratio ?? 0) * 100);
  return <section aria-label="월별 예산 현황" className="space-y-3 rounded-3xl bg-accent-soft p-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-accent-ink">{Number(month.slice(5))}월 예산</h2>
      {link && <Link href={`/budget?month=${month}`} className={linkClass}>예산·구매 후보 ›</Link>}
    </div>
    {budget.amount === null ? <>
      <p className="text-xl font-bold">예산을 설정하면 남은 금액을 확인할 수 있어요.</p>
      <p className="text-sm text-muted">이번 달 사용 {won(budget.spent)}</p>
    </> : <>
      <p className={`text-3xl font-bold ${exceeded ? "text-loss" : ""}`}>{remainingText(budget.remaining!)}</p>
      <div role="progressbar" aria-label="예산 사용률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} className="h-2.5 overflow-hidden rounded-full bg-surface">
        <div className={`h-full rounded-full ${exceeded ? "bg-loss" : "bg-accent"}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-muted">
        {ratio === null ? "이번 달은 지출 없는 달로 설정했어요." : `${won(budget.amount)} 중 ${won(budget.spent)} 사용 · ${Math.round(ratio * 100)}%`}
        {exceeded ? " · 예산을 초과했어요." : ratio !== null && ratio >= 0.8 ? " · 80% 넘게 썼어요." : ""}
      </p>
    </>}
    {budget.undated > 0 && <p className="text-sm text-warn">구매일 없는 품목 {budget.undated}개는 월별 계산에서 제외됩니다.</p>}
    {budget.pendingShipping > 0 && <p className="text-sm text-warn">이번 달 품목 {budget.pendingShipping}개는 배송비가 추가될 수 있어요.</p>}
  </section>;
}
