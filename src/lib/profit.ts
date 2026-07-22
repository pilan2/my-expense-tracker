// prisma를 건드리지 않는 순수 계산 함수만 모아둔 파일. item-card.tsx처럼 클라이언트
// 컴포넌트에서도 import할 수 있어야 해서, server-only인 lib/sales.ts와 분리했다.

// 판매 건 하나(quantitySold, saleAmount)만의 손익. calcProfit을 원소 1개짜리 배열로 호출해 재사용.
export function calcSaleProfit(sale: {
  quantitySold: number;
  saleAmount: number;
  item: { price: number; shippingFee: number; quantity: number };
}): number {
  return calcProfit(sale.item.price, sale.item.shippingFee, sale.item.quantity, [
    { quantitySold: sale.quantitySold, saleAmount: sale.saleAmount },
  ]);
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
  // 배송비를 판매 수량 비율로 나누면 1원 미만 단수가 남을 수 있어, 원 단위로 반올림한다.
  const shippingShare = purchasedQuantity > 0 ? (shippingFee * soldQuantity) / purchasedQuantity : 0;
  const cost = purchasePrice * soldQuantity + shippingShare;
  return Math.round(saleTotal - cost);
}
