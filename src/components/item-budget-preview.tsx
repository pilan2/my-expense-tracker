import { currentData } from "@/lib/local/database";
import { monthBudget, remainingText, won } from "@/lib/budget";
import { isBudgetMonth } from "@/lib/local/models";
import { manwonToWon } from "@/lib/money";

export function ItemBudgetPreview({ date, price, quantity, shippingFee, itemId }: { date: string; price: string; quantity: number; shippingFee: string; itemId?: string }) {
  const unit = Number(manwonToWon(price)), fee = Number(manwonToWon(shippingFee));
  const cost = unit * quantity + fee;
  const valid = Number.isFinite(cost) && Number(price) >= 0 && Number(shippingFee) >= 0 && quantity >= 1;
  // 저장 버튼 바로 위에서 이번 구매의 합계와 예산 영향을 한 번에 확인한다.
  const total = valid && <p className="font-medium">합계 {won(unit)} × {quantity}{fee > 0 ? ` + 배송비 ${won(fee)}` : ""} = {won(cost)}</p>;
  if (!date || !isBudgetMonth(date.slice(0, 7))) {
    return <aside aria-label="구매 합계" aria-live="polite" className="space-y-1 rounded-2xl border border-line bg-surface p-3 text-sm shadow-card">
      {total}
      <p className="text-warn">구매일을 입력하면 해당 월의 예산과 비교할 수 있어요. 날짜가 없으면 월별 예산 계산에서 제외됩니다.</p>
    </aside>;
  }
  if (!valid) return null;
  const budget = monthBudget(currentData(), date.slice(0, 7), itemId);
  const remaining = budget.remaining === null ? null : budget.remaining - cost;
  return <aside aria-label="구매 후 예산" aria-live="polite" className="space-y-1 rounded-2xl border border-line bg-surface p-3 text-sm shadow-card">
    {total}
    <p className={remaining !== null && remaining < 0 ? "font-semibold text-loss" : ""}>{remaining === null ? `${date.slice(0, 7)} 예산이 설정되지 않았습니다.` : `이 품목을 저장하면 ${date.slice(0, 7)} 예산 ${remainingText(remaining)}`}</p>
    {itemId && <p>기존 품목 금액을 제외하고 수정할 금액으로 계산합니다.</p>}
    {remaining !== null && remaining < 0 && <p>예산을 초과해도 실제 구매 기록은 저장할 수 있습니다.</p>}
  </aside>;
}
