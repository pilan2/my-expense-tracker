import "server-only";
import { prisma } from "@/lib/prisma";

export function getItems() {
  return prisma.item.findMany({ orderBy: { createdAt: "desc" } });
}

export function getItem(id: string) {
  return prisma.item.findUnique({ where: { id } });
}

export async function getFieldSuggestions() {
  const [genres, characters, itemTypes] = await Promise.all([
    prisma.item.findMany({ distinct: ["genre"], select: { genre: true }, orderBy: { genre: "asc" } }),
    prisma.item.findMany({ distinct: ["character"], select: { character: true }, orderBy: { character: "asc" } }),
    prisma.item.findMany({ distinct: ["itemType"], select: { itemType: true }, orderBy: { itemType: "asc" } }),
  ]);

  return {
    genres: genres.map((g) => g.genre),
    characters: characters.map((c) => c.character),
    itemTypes: itemTypes.map((t) => t.itemType),
  };
}
