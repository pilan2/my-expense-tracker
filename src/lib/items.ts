import "server-only";
import { prisma } from "@/lib/prisma";
import { calcRemainingQuantity } from "@/lib/sales";

const SALES_FOR_CARD = { select: { quantitySold: true, saleAmount: true } } as const;

export async function getItems(options?: { pendingShippingOnly?: boolean }) {
  const items = await prisma.item.findMany({
    where: options?.pendingShippingOnly ? { hasOverseasShipping: true } : undefined,
    orderBy: { createdAt: "desc" },
    include: { sales: SALES_FOR_CARD },
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

// /browse/[genre]/[character] 드릴다운 마지막 단계에서 쓰는, 해당 장르+캐릭터의 품목만.
export async function getItemsByCategory(genre: string, character: string) {
  const items = await prisma.item.findMany({
    where: { genre, character },
    orderBy: { createdAt: "desc" },
    include: { sales: SALES_FOR_CARD },
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

// 묶음 판매 화면에서, 체크박스로 선택된 품목 id들만.
export async function getItemsByIds(ids: string[]) {
  const items = await prisma.item.findMany({
    where: { id: { in: ids } },
    include: { sales: SALES_FOR_CARD },
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

export function getItem(id: string) {
  return prisma.item.findUnique({ where: { id } });
}

// 아직 현물이 아닌(=발송 대기 중인) 품목을 발송예정일이 가까운 순으로. limit 없으면 전부.
export async function getUpcomingShipments(limit?: number) {
  const items = await prisma.item.findMany({
    where: { isPhysical: false, expectedShipDate: { not: null } },
    orderBy: { expectedShipDate: "asc" },
    include: { sales: SALES_FOR_CARD },
    ...(limit ? { take: limit } : {}),
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

// /stats 월별 목록에서, 해당 달에 구매한 품목만. genre를 주면 그 장르로만 좁힌다.
export async function getPurchasesInMonth(year: number, month: number, genre?: string) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const items = await prisma.item.findMany({
    where: { purchasedAt: { gte: start, lt: end }, ...(genre ? { genre } : {}) },
    orderBy: { purchasedAt: "desc" },
    include: { sales: SALES_FOR_CARD },
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

// /shipments 달력에서 특정 달(month: 1~12)에 발송예정일이 있는 품목만.
export function getShipmentsInMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return prisma.item.findMany({
    where: { isPhysical: false, expectedShipDate: { gte: start, lt: end } },
    orderBy: { expectedShipDate: "asc" },
  });
}

// /shipments 달력에서 하루를 클릭했을 때, 그날 발송예정인 품목 전체.
export async function getShipmentsOnDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);

  const items = await prisma.item.findMany({
    where: { isPhysical: false, expectedShipDate: { gte: start, lt: end } },
    orderBy: { character: "asc" },
    include: { sales: SALES_FOR_CARD },
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

// 대시보드 "최근 구매" 미리보기 및 /purchases 전체 목록. limit 없으면 전부.
export async function getRecentPurchases(limit?: number) {
  const items = await prisma.item.findMany({
    orderBy: { purchasedAt: "desc" },
    include: { sales: SALES_FOR_CARD },
    ...(limit ? { take: limit } : {}),
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

export async function getFieldSuggestions() {
  const [series, itemTypes] = await Promise.all([
    prisma.item.findMany({
      distinct: ["series"],
      select: { series: true },
      where: { series: { not: null } },
      orderBy: { series: "asc" },
    }),
    prisma.item.findMany({ distinct: ["itemType"], select: { itemType: true }, orderBy: { itemType: "asc" } }),
  ]);

  return {
    series: series.map((s) => s.series as string),
    itemTypes: itemTypes.map((t) => t.itemType),
  };
}
