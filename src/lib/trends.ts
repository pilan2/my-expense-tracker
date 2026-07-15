import "server-only";
import { prisma } from "@/lib/prisma";

export type MonthlyPoint = { month: string; purchaseTotal: number; saleTotal: number };
export type GenreMonthlyTrend = { genre: string; points: MonthlyPoint[] };

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function toSortedPoints(monthMap: Map<string, { purchaseTotal: number; saleTotal: number }>): MonthlyPoint[] {
  return [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totals]) => ({ month, ...totals }));
}

// 장르는 분류상 "기타"를 항상 맨 아래로.
function compareGenreWithEtcLast(a: string, b: string) {
  if (a === "기타") return 1;
  if (b === "기타") return -1;
  return a.localeCompare(b, "ko");
}

// 월별 전체 구매/판매 총액 추이. 구매는 구매일, 판매는 판매일 기준으로 집계.
export async function getMonthlyTrends(): Promise<MonthlyPoint[]> {
  const [items, sales] = await Promise.all([
    prisma.item.findMany({ select: { purchasedAt: true, price: true, quantity: true, shippingFee: true } }),
    prisma.sale.findMany({ select: { saleDate: true, saleAmount: true } }),
  ]);

  const monthMap = new Map<string, { purchaseTotal: number; saleTotal: number }>();

  for (const item of items) {
    const key = monthKey(item.purchasedAt);
    const entry = monthMap.get(key) ?? { purchaseTotal: 0, saleTotal: 0 };
    entry.purchaseTotal += Number(item.price) * item.quantity + Number(item.shippingFee);
    monthMap.set(key, entry);
  }
  for (const sale of sales) {
    const key = monthKey(sale.saleDate);
    const entry = monthMap.get(key) ?? { purchaseTotal: 0, saleTotal: 0 };
    entry.saleTotal += Number(sale.saleAmount);
    monthMap.set(key, entry);
  }

  return toSortedPoints(monthMap);
}

// 장르별 월별 구매/판매 총액 추이.
export async function getMonthlyTrendsByGenre(): Promise<GenreMonthlyTrend[]> {
  const items = await prisma.item.findMany({
    select: {
      genre: true,
      purchasedAt: true,
      price: true,
      quantity: true,
      shippingFee: true,
      sales: { select: { saleDate: true, saleAmount: true } },
    },
  });

  const genreMap = new Map<string, Map<string, { purchaseTotal: number; saleTotal: number }>>();

  for (const item of items) {
    if (!genreMap.has(item.genre)) genreMap.set(item.genre, new Map());
    const monthMap = genreMap.get(item.genre)!;

    const purchaseKey = monthKey(item.purchasedAt);
    const purchaseEntry = monthMap.get(purchaseKey) ?? { purchaseTotal: 0, saleTotal: 0 };
    purchaseEntry.purchaseTotal += Number(item.price) * item.quantity + Number(item.shippingFee);
    monthMap.set(purchaseKey, purchaseEntry);

    for (const sale of item.sales) {
      const saleKey = monthKey(sale.saleDate);
      const saleEntry = monthMap.get(saleKey) ?? { purchaseTotal: 0, saleTotal: 0 };
      saleEntry.saleTotal += Number(sale.saleAmount);
      monthMap.set(saleKey, saleEntry);
    }
  }

  return [...genreMap.entries()]
    .map(([genre, monthMap]) => ({ genre, points: toSortedPoints(monthMap) }))
    .sort((a, b) => compareGenreWithEtcLast(a.genre, b.genre));
}

export type GenreComparisonSeries = { genre: string; values: number[] };
export type GenreComparisonTrend = {
  months: string[];
  purchase: GenreComparisonSeries[];
  sale: GenreComparisonSeries[];
};

// 한 좌표계에서 겹쳐볼 수 있는 색상 슬롯은 최대 8개(팔레트 고정 순서)라, 장르가 그보다 많으면
// 활동량(구매+판매) 상위 7개만 남기고 나머지는 "기타"로 합친다.
const MAX_GENRE_SERIES = 8;

// 장르별 월별 구매/판매 추이를 같은 좌표계에서 겹쳐 비교할 수 있도록, 전체 월 목록에 맞춰
// 값이 없는 달은 0으로 채워 정렬한다.
export async function getGenreComparisonTrends(): Promise<GenreComparisonTrend> {
  const byGenre = await getMonthlyTrendsByGenre();
  const withActivity = byGenre.map((g) => ({
    ...g,
    activity: g.points.reduce((sum, p) => sum + p.purchaseTotal + p.saleTotal, 0),
  }));

  let selected = withActivity;
  if (withActivity.length > MAX_GENRE_SERIES) {
    const existingEtc = withActivity.find((g) => g.genre === "기타");
    const real = withActivity.filter((g) => g.genre !== "기타").sort((a, b) => b.activity - a.activity);
    const kept = real.slice(0, MAX_GENRE_SERIES - 1);
    const overflow = [...real.slice(MAX_GENRE_SERIES - 1), ...(existingEtc ? [existingEtc] : [])];

    const overflowMonthMap = new Map<string, { purchaseTotal: number; saleTotal: number }>();
    for (const g of overflow) {
      for (const p of g.points) {
        const entry = overflowMonthMap.get(p.month) ?? { purchaseTotal: 0, saleTotal: 0 };
        entry.purchaseTotal += p.purchaseTotal;
        entry.saleTotal += p.saleTotal;
        overflowMonthMap.set(p.month, entry);
      }
    }

    selected = [...kept, { genre: "기타", points: toSortedPoints(overflowMonthMap), activity: 0 }];
  }

  selected = [...selected].sort((a, b) => {
    if (a.genre === "기타") return 1;
    if (b.genre === "기타") return -1;
    return b.activity - a.activity;
  });

  const monthSet = new Set<string>();
  for (const g of selected) for (const p of g.points) monthSet.add(p.month);
  const months = [...monthSet].sort();

  function seriesFor(metric: "purchaseTotal" | "saleTotal"): GenreComparisonSeries[] {
    return selected.map((g) => {
      const byMonth = new Map(g.points.map((p) => [p.month, p[metric]]));
      return { genre: g.genre, values: months.map((m) => byMonth.get(m) ?? 0) };
    });
  }

  return { months, purchase: seriesFor("purchaseTotal"), sale: seriesFor("saleTotal") };
}

// 이번 달 구매/판매 총액 (대시보드 요약용).
export async function getCurrentMonthTotals(): Promise<{ purchaseTotal: number; saleTotal: number }> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [items, sales] = await Promise.all([
    prisma.item.findMany({
      where: { purchasedAt: { gte: start, lt: end } },
      select: { price: true, quantity: true, shippingFee: true },
    }),
    prisma.sale.findMany({
      where: { saleDate: { gte: start, lt: end } },
      select: { saleAmount: true },
    }),
  ]);

  const purchaseTotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity + Number(item.shippingFee), 0);
  const saleTotal = sales.reduce((sum, sale) => sum + Number(sale.saleAmount), 0);

  return { purchaseTotal, saleTotal };
}
