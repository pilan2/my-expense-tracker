import { localAction } from "../local/action";
import { transactionDb as db } from "../local/repository";
import { currentMonth } from "../budget";
import { isBudgetMonth } from "../local/models";
import { manwonToWon } from "../money";

function monthValue(value: FormDataEntryValue | null) {
  const month = String(value ?? "");
  if (!isBudgetMonth(month)) throw new Error("월을 올바르게 입력해주세요.");
  return month;
}
function money(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  if (!value || !Number.isFinite(Number(value)) || Number(value) < 0) throw new Error("금액을 올바르게 입력해주세요.");
  return Number(manwonToWon(value));
}
export const saveBudget = localAction(async (form: FormData) => {
  const id = monthValue(form.get("month")), amount = money(form, "amount");
  const mode = form.get("mode");
  if (mode !== "default" && mode !== "month") throw new Error("예산 설정 방식을 확인해주세요.");
  if (mode === "default" && id < currentMonth()) throw new Error("기본 예산은 이번 달 또는 미래 달부터 변경할 수 있습니다.");
  const model = mode === "default" ? db.budgetRule : db.monthlyBudget;
  model.upsert({ where: { id }, create: { id, amount }, update: { amount } });
});
export const resetMonthlyBudget = localAction(async (month: string) => {
  db.monthlyBudget.deleteMany({ where: { id: month } });
});
export const saveWish = localAction(async (id: string | null, form: FormData) => {
  const values = {
    title: String(form.get("title") ?? "").trim(), month: monthValue(form.get("month")),
    price: money(form, "price"), shippingFee: money(form, "shippingFee"), quantity: Number(form.get("quantity")),
    reason: String(form.get("reason") ?? "").trim() || null, priority: Number(form.get("priority")),
    deadline: form.get("deadline") ? new Date(String(form.get("deadline"))) : null,
    purchaseLink: String(form.get("purchaseLink") ?? "").trim() || null,
  };
  if (id) {
    const existing = db.wish.findUniqueOrThrow({ where: { id } });
    if (existing.status !== "pending") throw new Error("구매 완료된 후보는 수정할 수 없습니다.");
    db.wish.update({ where: { id }, data: values });
  } else db.wish.create({ data: { ...values, status: "pending" } });
});
export const deleteWish = localAction(async (id: string) => { db.wish.delete({ where: { id } }); });
