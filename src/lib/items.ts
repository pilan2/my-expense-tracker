import "server-only";
import { prisma } from "@/lib/prisma";
import { calcRemainingQuantity } from "@/lib/sales";

export async function getItems() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    include: { sales: { select: { quantitySold: true } } },
  });

  return items.map((item) => ({
    ...item,
    remainingQuantity: calcRemainingQuantity(item.quantity, item.sales),
  }));
}

export function getItem(id: string) {
  return prisma.item.findUnique({ where: { id } });
}

// 대시보드에 띄울, 아직 현물이 아닌(=발송 대기 중인) 품목을 발송예정일이 가까운 순으로.
export function getUpcomingShipments() {
  return prisma.item.findMany({
    where: { isPhysical: false, expectedShipDate: { not: null } },
    orderBy: { expectedShipDate: "asc" },
    take: 10,
  });
}

export async function getFieldSuggestions() {
  const [genres, characters, series, itemTypes] = await Promise.all([
    prisma.item.findMany({ distinct: ["genre"], select: { genre: true }, orderBy: { genre: "asc" } }),
    prisma.item.findMany({ distinct: ["character"], select: { character: true }, orderBy: { character: "asc" } }),
    prisma.item.findMany({
      distinct: ["series"],
      select: { series: true },
      where: { series: { not: null } },
      orderBy: { series: "asc" },
    }),
    prisma.item.findMany({ distinct: ["itemType"], select: { itemType: true }, orderBy: { itemType: "asc" } }),
  ]);

  return {
    genres: genres.map((g) => g.genre),
    characters: characters.map((c) => c.character),
    series: series.map((s) => s.series as string),
    itemTypes: itemTypes.map((t) => t.itemType),
  };
}
