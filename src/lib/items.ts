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
