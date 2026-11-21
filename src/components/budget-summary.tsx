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
  // 조금이라도 넘었으면 반올림으로 "0% 초과"가 되지 않게 최소 101%로 보여준다.
  const usedPercent = exceeded ? Math.max(101, Math.round((ratio ?? 0) * 100)) : Math.round((ratio ?? 0) * 100);
  return <section aria-label="월별 예산 현황" className="space-y-3 rounded-3xl bg-accent-soft p-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-accent-ink">{Number(month.slice(5))}월 예산</h2>
      {link && <Link href={`/budget?month=${month}`} className={linkClass}>예산 설정 ›</Link>}
    </div>
    {budget.amount === null ? <>
      <p className="text-xl font-bold">예산을 설정하면 남은 금액을 확인할 수 있어요.</p>
      <p className="text-sm text-muted">이번 달 사용 {won(budget.spent)}</p>
    </> : <>
      <p className={`text-3xl font-bold ${exceeded ? "text-loss" : ""}`}>{remainingText(budget.remaining!)}</p>
      {/* 초과하면 막대 전체를 쓴 금액으로 보고, 예산까지는 분홍·넘친 부분은 빨강으로 나눠 얼마나 넘었는지 보이게 한다. */}
      <div role="progressbar" aria-label="예산 사용률" aria-valuemin={0} aria-valuemax={Math.max(100, usedPercent)} aria-valuenow={usedPercent} className="flex h-2.5 overflow-hidden rounded-full bg-surface">
        {exceeded && ratio !== null ? <>
          <div className="h-full bg-accent" style={{ width: `${100 / ratio}%` }} />
          <div className="h-full bg-loss" style={{ width: `${100 - 100 / ratio}%` }} />
        </> : <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />}
      </div>
      <p className="text-sm text-muted">
        {ratio === null ? "이번 달은 지출 없는 달로 설정했어요." : `${won(budget.amount)} 중 ${won(budget.spent)} 사용 · ${usedPercent}%`}
        {exceeded && ratio !== null ? <span className="font-semibold text-loss"> · {usedPercent - 100}% 초과</span> : ratio !== null && ratio >= 0.8 ? " · 80% 넘게 썼어요." : ""}
      </p>
    </>}
    {/* 계산 방식에 관한 참고는 홈에서는 빼고 예산 화면에서만 보여준다. */}
    {!link && budget.pendingShipping > 0 && <p className="text-sm text-warn">배송비가 아직 안 정해진 품목 {budget.pendingShipping}개가 있어요.</p>}
  </section>;
}
