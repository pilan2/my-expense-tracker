import { localAction } from "@/lib/local/action";

import { redirect } from "@/lib/local/navigation";
import { transactionDb as db } from "@/lib/local/repository";
import { manwonToWon } from "@/lib/money";
import { calcRemainingQuantity } from "@/lib/sales";
import { splitProportionally } from "@/lib/split";

export const createSale = localAction(async function createSale(itemId: string, formData: FormData) {

  const quantitySold = Number(formData.get("quantitySold"));
  const saleAmount = manwonToWon(String(formData.get("saleAmount") ?? "0"));
  const saleDateRaw = formData.get("saleDate");
  // 판매일을 모르면 비워둘 수 있다 (날짜 기반 통계에서만 제외되고, 합계 통계에는 그대로 포함).
  const saleDate = saleDateRaw ? new Date(String(saleDateRaw)) : null;

  const item = await db.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { sales: { select: { quantitySold: true } } },
  });
  const remaining = calcRemainingQuantity(item.quantity, item.sales);

  if (quantitySold < 1 || quantitySold > remaining) {
    throw new Error("판매 수량은 1개 이상, 잔여 수량 이하여야 합니다.");
  }

  await db.sale.create({ data: { itemId, quantitySold, saleAmount, saleDate } });

});

// 여러 품목을 한 건으로 묶어 팔 때: 총 판매액을 (구매 단가 × 판매 수량) 비율로 나눠
// 품목별 Sale을 만든다.
export const createBulkSale = localAction(async function createBulkSale(formData: FormData) {

  const itemIds = [...new Set(formData.getAll("itemIds").map(String))];
  const totalSaleWon = Number(manwonToWon(String(formData.get("totalSaleAmount") ?? "0")));
  const saleDateRaw = formData.get("saleDate");
  // 판매일을 모르면 비워둘 수 있다 (날짜 기반 통계에서만 제외되고, 합계 통계에는 그대로 포함).
  const saleDate = saleDateRaw ? new Date(String(saleDateRaw)) : null;

  if (itemIds.length < 2) {
    throw new Error("묶음 판매는 품목을 2개 이상 선택해야 합니다.");
  }
  if (totalSaleWon <= 0) {
    throw new Error("판매 금액을 입력해주세요.");
  }

  const items = await db.item.findMany({
    where: { id: { in: itemIds } },
    include: { sales: { select: { quantitySold: true } } },
  });

  if (items.length !== itemIds.length) throw new Error("선택한 품목이 변경됐습니다. 다시 선택해주세요.");

  const quantities = items.map((item) => {
    const remaining = calcRemainingQuantity(item.quantity, item.sales);
    const requested = Number(formData.get(`quantity_${item.id}`) ?? 0);
    if (requested < 1 || requested > remaining) {
      throw new Error(`${item.detail}의 판매 수량이 올바르지 않습니다.`);
    }
    return requested;
  });

  const weights = items.map((item, i) => Number(item.price) * quantities[i]);
  const shares = splitProportionally(totalSaleWon, weights);

  await db.batch(
    items.map((item, i) =>
      db.sale.create({
        data: { itemId: item.id, quantitySold: quantities[i], saleAmount: shares[i], saleDate },
      }),
    ),
  );

  redirect("/items");
});

export const deleteSale = localAction(async function deleteSale(saleId: string) {

  await db.sale.delete({ where: { id: saleId } });

});
