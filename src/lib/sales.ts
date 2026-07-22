import "server-only";
import { prisma } from "@/lib/prisma";

export { calcSaleProfit, calcRemainingQuantity, calcProfit } from "@/lib/profit";

export function getSalesForItem(itemId: string) {
  return prisma.sale.findMany({ where: { itemId }, orderBy: { saleDate: "desc" } });
}

// 대시보드 "최근 판매" 미리보기(limit 지정) 및 /sales 전체 목록(limit 없음).
// item의 price/shippingFee/quantity는 이 판매 건 자체의 손익 계산용.
// 판매일이 없는(모름) 건은 미리보기에서는 제외하고, 전체 목록에서는 맨 뒤에 보여준다.
export function getRecentSales(limit?: number) {
  return prisma.sale.findMany({
    where: limit ? { saleDate: { not: null } } : undefined,
    orderBy: limit ? { saleDate: "desc" } : { saleDate: { sort: "desc", nulls: "last" } },
    ...(limit ? { take: limit } : {}),
    include: {
      item: {
        select: {
          genre: true,
          character: true,
          series: true,
          itemType: true,
          detail: true,
          price: true,
          shippingFee: true,
          quantity: true,
        },
      },
    },
  });
}

// /stats 월별 목록에서, 해당 달에 판매된 내역만. genre를 주면 그 장르로만 좁힌다.
export function getSalesInMonth(year: number, month: number, genre?: string) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return prisma.sale.findMany({
    where: { saleDate: { gte: start, lt: end }, ...(genre ? { item: { genre } } : {}) },
    orderBy: { saleDate: "desc" },
    include: {
      item: {
        select: {
          genre: true,
          character: true,
          series: true,
          detail: true,
          price: true,
          shippingFee: true,
          quantity: true,
        },
      },
    },
  });
}

