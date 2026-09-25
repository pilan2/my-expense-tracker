import { localAction } from "@/lib/local/action";

import { transactionDb as db } from "@/lib/local/repository";
import { manwonToWon } from "@/lib/money";
import { splitProportionally } from "@/lib/split";

// 선택한 품목들에 총 배송비를 수량 비율대로 나눠 각 품목의 shippingFee에 배정한다.
// 배송비가 확정되었으니, "이후 해외배송비 존재" 체크도 함께 해제한다.
export const assignShippingFee = localAction(async function assignShippingFee(formData: FormData) {

  const itemIds = [...new Set(formData.getAll("itemIds").map(String))];
  const totalFeeWon = Number(manwonToWon(String(formData.get("totalShippingFee") ?? "0")));

  if (itemIds.length === 0) {
    throw new Error("배송비를 나눌 품목을 하나 이상 선택해주세요.");
  }
  if (totalFeeWon <= 0) {
    throw new Error("배송비를 입력해주세요.");
  }

  const items = await db.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, quantity: true },
  });

  if (items.length !== itemIds.length) throw new Error("선택한 품목이 변경됐습니다. 다시 선택해주세요.");

  const shares = splitProportionally(
    totalFeeWon,
    items.map((item) => item.quantity),
  );

  await db.batch(
    items.map((item, index) =>
      db.item.update({
        where: { id: item.id },
        data: { shippingFee: shares[index], hasOverseasShipping: false },
      }),
    ),
  );

});
