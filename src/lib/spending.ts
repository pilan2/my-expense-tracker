import "server-only";
import { prisma } from "@/lib/prisma";

export type CategoryTotal = { name: string; total: number };

function groupTotals(
  items: { genre: string; character: string; itemType: string; price: { toString(): string }; quantity: number }[],
  key: "genre" | "character" | "itemType",
): CategoryTotal[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    const amount = Number(item.price) * item.quantity;
    totals.set(item[key], (totals.get(item[key]) ?? 0) + amount);
  }

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

export async function getSpendingSummary() {
  const items = await prisma.item.findMany({
    select: { genre: true, character: true, itemType: true, price: true, quantity: true },
  });

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return {
    total,
    byGenre: groupTotals(items, "genre"),
    byCharacter: groupTotals(items, "character"),
    byItemType: groupTotals(items, "itemType"),
  };
}
