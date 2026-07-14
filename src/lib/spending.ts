import "server-only";
import { prisma } from "@/lib/prisma";
import { calcProfit } from "@/lib/sales";

export type CharacterSummary = {
  name: string;
  purchaseTotal: number;
  saleTotal: number;
  profit: number;
};

export type GenreSummary = {
  name: string;
  purchaseTotal: number;
  saleTotal: number;
  profit: number;
  characters: CharacterSummary[];
};

export type CategorySummary = {
  totalPurchase: number;
  totalSale: number;
  totalProfit: number;
  genres: GenreSummary[];
};

function addInto(target: { purchaseTotal: number; saleTotal: number; profit: number }, item: {
  purchaseTotal: number;
  saleTotal: number;
  profit: number;
}) {
  target.purchaseTotal += item.purchaseTotal;
  target.saleTotal += item.saleTotal;
  target.profit += item.profit;
}

// 구매액 내림차순 정렬하되, "기타"는 분류상 항상 맨 아래로.
function compareWithEtcLast(a: { name: string; purchaseTotal: number }, b: { name: string; purchaseTotal: number }) {
  if (a.name === "기타") return 1;
  if (b.name === "기타") return -1;
  return b.purchaseTotal - a.purchaseTotal;
}

// 품목을 장르 > 캐릭터로 묶어서, 각 단위마다 구매액/판매액/손익을 함께 계산한다.
// 판매되지 않은 품목은 saleTotal=0, profit은 판매된 만큼만 반영(배송비도 판매 비율만큼만).
export async function getCategorySummary(): Promise<CategorySummary> {
  const items = await prisma.item.findMany({
    select: {
      genre: true,
      character: true,
      price: true,
      quantity: true,
      shippingFee: true,
      sales: { select: { quantitySold: true, saleAmount: true } },
    },
  });

  const genreMap = new Map<string, Map<string, CharacterSummary>>();

  for (const item of items) {
    const sales = item.sales.map((s) => ({ quantitySold: s.quantitySold, saleAmount: Number(s.saleAmount) }));
    const purchaseTotal = Number(item.price) * item.quantity + Number(item.shippingFee);
    const saleTotal = sales.reduce((sum, s) => sum + s.saleAmount, 0);
    const profit = calcProfit(Number(item.price), Number(item.shippingFee), item.quantity, sales);

    if (!genreMap.has(item.genre)) genreMap.set(item.genre, new Map());
    const characterMap = genreMap.get(item.genre)!;

    const existing = characterMap.get(item.character) ?? {
      name: item.character,
      purchaseTotal: 0,
      saleTotal: 0,
      profit: 0,
    };
    addInto(existing, { purchaseTotal, saleTotal, profit });
    characterMap.set(item.character, existing);
  }

  const genres: GenreSummary[] = [...genreMap.entries()]
    .map(([genre, characterMap]) => {
      const characters = [...characterMap.values()].sort(compareWithEtcLast);
      const totals = characters.reduce(
        (acc, c) => (addInto(acc, c), acc),
        { purchaseTotal: 0, saleTotal: 0, profit: 0 },
      );
      return { name: genre, ...totals, characters };
    })
    .sort(compareWithEtcLast);

  const totals = genres.reduce(
    (acc, g) => (addInto(acc, g), acc),
    { purchaseTotal: 0, saleTotal: 0, profit: 0 },
  );

  return {
    totalPurchase: totals.purchaseTotal,
    totalSale: totals.saleTotal,
    totalProfit: totals.profit,
    genres,
  };
}
