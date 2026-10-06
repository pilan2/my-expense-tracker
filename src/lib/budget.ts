import { isBudgetMonth, type Data, type Wish } from "./local/models";

export function todayString(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function currentMonth() { return todayString().slice(0, 7); }
export function budgetAmount(data: Data, month: string): number | null {
  if (!isBudgetMonth(month)) throw new Error("월을 확인해주세요.");
  const override = data.monthlyBudget.find(row => row.id === month);
  if (override) return override.amount;
  const rule = data.budgetRule.filter(row => row.id <= month).sort((a, b) => b.id.localeCompare(a.id))[0];
  return rule?.amount ?? null;
}
export function monthBudget(data: Data, month: string, excludeItemId?: string) {
  const items = data.item.filter(row => row.id !== excludeItemId && row.purchasedAt?.toISOString().slice(0, 7) === month);
  const spent = items.reduce((sum, row) => sum + row.price * row.quantity + row.shippingFee, 0);
  const amount = budgetAmount(data, month);
  return { amount, spent, remaining: amount === null ? null : amount - spent,
    undated: data.item.filter(row => !row.purchasedAt && row.id !== excludeItemId).length,
    pendingShipping: items.filter(row => row.hasOverseasShipping).length };
}
export function wishCost(wish: Pick<Wish, "price" | "quantity" | "shippingFee">) { return wish.price * wish.quantity + wish.shippingFee; }
export function won(value: number) { return `${value.toLocaleString("ko-KR")}원`; }
export function remainingText(value: number) { return value < 0 ? `${won(-value)} 초과` : `${won(value)} 남음`; }
