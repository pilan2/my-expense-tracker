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

// /browse/makers/[maker]에서 쓰는, 해당 제작자(장르 무관)의 품목만.
export async function getItemsByMaker(maker: string) {
  const items = await prisma.item.findMany({
    where: { maker },
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
  return prisma.item.findUnique({
    where: { id },
    include: { shippingGroup: { select: { id: true, label: true } } },
  });
}

// 아직 현물이 아닌(=발송 대기 중인) 품목을 발송예정일이 가까운 순으로. limit 없으면 전부.
// 월 단위로만 아는(shipDateApprox) 품목은 그 달 1일로 저장돼 있으므로, prisma 정렬만으로는
// 같은 달의 특정일 품목보다 뒤로 밀릴 수 있다. 같은 달이면 월 단위 품목이 먼저 오도록 다시 정렬한다.
export async function getUpcomingShipments(limit?: number) {
  const items = await prisma.item.findMany({
    where: { isPhysical: false, expectedShipDate: { not: null } },
    orderBy: { expectedShipDate: "asc" },
    include: { sales: SALES_FOR_CARD },
    ...(limit ? { take: limit } : {}),
  });

  items.sort((a, b) => {
    const aMonthKey = a.expectedShipDate!.getFullYear() * 12 + a.expectedShipDate!.getMonth();
    const bMonthKey = b.expectedShipDate!.getFullYear() * 12 + b.expectedShipDate!.getMonth();
    if (aMonthKey !== bMonthKey) return aMonthKey - bMonthKey;
    if (a.shipDateApprox !== b.shipDateApprox) return a.shipDateApprox ? -1 : 1;
    return a.expectedShipDate!.getTime() - b.expectedShipDate!.getTime();
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
// 월 단위로만 아는(shipDateApprox) 품목은 날짜 칸에 넣을 수 없으므로, 호출하는 쪽에서
// shipDateApprox로 나눠 달력 칸/별도 목록으로 갈라 보여준다.
export async function getShipmentsInMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const items = await prisma.item.findMany({
    where: { isPhysical: false, expectedShipDate: { gte: start, lt: end } },
    orderBy: { expectedShipDate: "asc" },
    include: { sales: SALES_FOR_CARD },
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

// /shipments 달력에서 하루를 클릭했을 때, 그날 발송예정인 품목 전체.
// 월 단위로만 아는 품목은 특정일에 발송된다고 오해될 수 있으므로 여기서는 제외한다(달력 밑
// 별도 목록에서만 보여준다).
export async function getShipmentsOnDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);

  const items = await prisma.item.findMany({
    where: { isPhysical: false, shipDateApprox: false, expectedShipDate: { gte: start, lt: end } },
    orderBy: { character: "asc" },
    include: { sales: SALES_FOR_CARD },
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

// 대시보드 "최근 구매" 미리보기(limit 지정) 및 /purchases 전체 목록(limit 없음).
// 구매일이 없는(모름) 품목은 미리보기에서는 제외하고, 전체 목록에서는 맨 뒤에 보여준다.
export async function getRecentPurchases(limit?: number) {
  const items = await prisma.item.findMany({
    where: limit ? { purchasedAt: { not: null } } : undefined,
    orderBy: limit ? { purchasedAt: "desc" } : { purchasedAt: { sort: "desc", nulls: "last" } },
    include: { sales: SALES_FOR_CARD },
    ...(limit ? { take: limit } : {}),
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}
