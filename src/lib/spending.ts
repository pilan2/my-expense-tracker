import "server-only";
import { prisma } from "@/lib/prisma";

export type CategoryTotal = { name: string; total: number };

function groupTotals(entries: { category: string; amount: number }[]): CategoryTotal[] {
  const totals = new Map<string, number>();

  for (const { category, amount } of entries) {
    totals.set(category, (totals.get(category) ?? 0) + amount);
  }

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

export async function getSpendingSummary() {
  const items = await prisma.item.findMany({
    select: {
      genre: true,
      character: true,
      itemType: true,
      price: true,
      quantity: true,
      shippingFee: true,
    },
  });

  // 배송비는 라인 전체에 대한 고정값이라 수량과 곱하지 않고 그대로 더한다.
  const amounts = items.map((item) => ({
    item,
    amount: Number(item.price) * item.quantity + Number(item.shippingFee),
  }));
  const total = amounts.reduce((sum, a) => sum + a.amount, 0);

  return {
    total,
    byGenre: groupTotals(amounts.map((a) => ({ category: a.item.genre, amount: a.amount }))),
    byCharacter: groupTotals(amounts.map((a) => ({ category: a.item.character, amount: a.amount }))),
    byItemType: groupTotals(amounts.map((a) => ({ category: a.item.itemType, amount: a.amount }))),
  };
}

export async function getSalesSummary() {
  const sales = await prisma.sale.findMany({
    select: {
      saleAmount: true,
      item: { select: { genre: true, character: true, itemType: true } },
    },
  });

  const amounts = sales.map((sale) => ({ sale, amount: Number(sale.saleAmount) }));
  const total = amounts.reduce((sum, a) => sum + a.amount, 0);

  return {
    total,
    byGenre: groupTotals(amounts.map((a) => ({ category: a.sale.item.genre, amount: a.amount }))),
    byCharacter: groupTotals(
      amounts.map((a) => ({ category: a.sale.item.character, amount: a.amount })),
    ),
    byItemType: groupTotals(
      amounts.map((a) => ({ category: a.sale.item.itemType, amount: a.amount })),
    ),
  };
}
