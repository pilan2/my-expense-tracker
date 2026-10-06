import { currentData } from "@/lib/local/database";
import { monthBudget, remainingText, won } from "@/lib/budget";
import { isBudgetMonth } from "@/lib/local/models";
import { manwonToWon } from "@/lib/money";

export function ItemBudgetPreview({ date, price, quantity, shippingFee, itemId }: { date: string; price: string; quantity: number; shippingFee: string; itemId?: string }) {
  if (!date || !isBudgetMonth(date.slice(0, 7))) return <p className="text-sm text-amber-700 dark:text-amber-400">구매일을 입력하면 해당 월의 예산과 비교할 수 있어요. 날짜가 없으면 월별 예산 계산에서 제외됩니다.</p>;
  const budget = monthBudget(currentData(), date.slice(0, 7), itemId);
  const cost = Number(manwonToWon(price)) * quantity + Number(manwonToWon(shippingFee));
  if (!Number.isFinite(cost) || Number(price) < 0 || Number(shippingFee) < 0 || quantity < 1) return null;
  const remaining = budget.remaining === null ? null : budget.remaining - cost;
  return <aside aria-label="구매 후 예산" aria-live="polite" className="space-y-1 rounded border border-neutral-300 p-3 text-sm dark:border-neutral-700">
    <p>{date.slice(0, 7)} 구매 금액 {won(cost)}</p>
    <p className={remaining !== null && remaining < 0 ? "font-semibold text-red-600" : ""}>{remaining === null ? "해당 월의 예산이 설정되지 않았습니다." : `이 품목을 저장하면 ${remainingText(remaining)}`}</p>
    {itemId && <p>기존 품목 금액을 제외하고 수정할 금액으로 계산합니다.</p>}
    {remaining !== null && remaining < 0 && <p>예산을 초과해도 실제 구매 기록은 저장할 수 있습니다.</p>}
  </aside>;
}
