import "server-only";
import { prisma } from "@/lib/prisma";

export function getSalesForItem(itemId: string) {
  return prisma.sale.findMany({ where: { itemId }, orderBy: { saleDate: "desc" } });
}

// 대시보드 "최근 판매" 미리보기.
export function getRecentSales(limit: number) {
  return prisma.sale.findMany({
    orderBy: { saleDate: "desc" },
    take: limit,
    include: { item: { select: { genre: true, character: true, detail: true } } },
  });
}

// quantity는 구매 당시 원래 수량으로 고정하고, 잔여 수량은 판매 이력에서 그때그때 계산한다.
// 이렇게 해야 판매가 되어도 소비 금액(price * quantity) 집계가 변하지 않는다.
export function calcRemainingQuantity(
  purchasedQuantity: number,
  sales: { quantitySold: number }[],
): number {
  return purchasedQuantity - sales.reduce((sum, s) => sum + s.quantitySold, 0);
}

// 해당 품목에서 판매로 실현된 손익 = 판매액 합 - (구매 단가 * 판매된 수량 + 배송비 중 판매분 몫)
// 배송비는 라인 전체 고정값이므로, 판매된 수량 비율만큼만 원가에 반영한다.
export function calcProfit(
  purchasePrice: number,
  shippingFee: number,
  purchasedQuantity: number,
  sales: { quantitySold: number; saleAmount: number }[],
): number {
  const soldQuantity = sales.reduce((sum, s) => sum + s.quantitySold, 0);
  const saleTotal = sales.reduce((sum, s) => sum + s.saleAmount, 0);
  const shippingShare = purchasedQuantity > 0 ? (shippingFee * soldQuantity) / purchasedQuantity : 0;
  const cost = purchasePrice * soldQuantity + shippingShare;
  return saleTotal - cost;
}
