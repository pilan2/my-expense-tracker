import Link from "next/link";
import { getMonthlyTrends, getMonthlyTrendsByGenre, getGenreComparisonTrends } from "@/lib/trends";
import { getPurchasesInMonth } from "@/lib/items";
import { getSalesInMonth, calcSaleProfit } from "@/lib/sales";
import { parseMonthParam, monthParamString } from "@/lib/month";
import { shiftMonth } from "@/lib/calendar";
import { BackButton } from "@/components/back-button";
import { TrendLineChart } from "@/components/trend-chart";
import { GenreComparisonChart } from "@/components/genre-comparison-chart";
import { ItemCardContent } from "@/components/item-card";
import { itemHref } from "@/lib/nav";

function monthHref(year: number, month: number) {
  return `/stats?month=${monthParamString(year, month)}`;
}

// "기타"는 분류상 항상 맨 아래로.
function compareWithEtcLast(a: string, b: string) {
  if (a === "기타") return 1;
  if (b === "기타") return -1;
  return a.localeCompare(b, "ko");
}

type MonthPurchase = Awaited<ReturnType<typeof getPurchasesInMonth>>[number];
type MonthSale = Awaited<ReturnType<typeof getSalesInMonth>>[number];

function groupByGenreAndCharacter(purchases: MonthPurchase[], sales: MonthSale[]) {
  const genreMap = new Map<
    string,
    {
      purchaseTotal: number;
      saleTotal: number;
      characters: Map<string, { purchases: MonthPurchase[]; sales: MonthSale[] }>;
    }
  >();

  function getGenre(genre: string) {
    if (!genreMap.has(genre)) genreMap.set(genre, { purchaseTotal: 0, saleTotal: 0, characters: new Map() });
    return genreMap.get(genre)!;
  }
  function getCharacter(genre: string, character: string) {
    const genreEntry = getGenre(genre);
    if (!genreEntry.characters.has(character)) genreEntry.characters.set(character, { purchases: [], sales: [] });
    return genreEntry.characters.get(character)!;
  }

  for (const item of purchases) {
    const genreEntry = getGenre(item.genre);
    genreEntry.purchaseTotal += Number(item.price) * item.quantity + Number(item.shippingFee);
    getCharacter(item.genre, item.character).purchases.push(item);
  }
  for (const sale of sales) {
    const genreEntry = getGenre(sale.item.genre);
    genreEntry.saleTotal += Number(sale.saleAmount);
    getCharacter(sale.item.genre, sale.item.character).sales.push(sale);
  }

  return [...genreMap.entries()]
    .map(([genre, entry]) => ({
      genre,
      purchaseTotal: entry.purchaseTotal,
      saleTotal: entry.saleTotal,
      characters: [...entry.characters.entries()]
        .map(([character, group]) => ({ character, ...group }))
        .sort((a, b) => compareWithEtcLast(a.character, b.character)),
    }))
    .sort((a, b) => compareWithEtcLast(a.genre, b.genre));
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const parsed = parseMonthParam(monthParam);
  const now = new Date();
  const nowKey = now.getFullYear() * 12 + (now.getMonth() + 1);
  // 미래 달은 구매/판매가 있을 수 없으니, URL을 직접 조작해 넘어와도 이번 달로 고정한다.
  const isRequestedMonthInFuture = parsed.year * 12 + parsed.month > nowKey;
  const { year, month } = isRequestedMonthInFuture
    ? { year: now.getFullYear(), month: now.getMonth() + 1 }
    : parsed;

  const [overall, byGenre, comparison, monthPurchases, monthSales] = await Promise.all([
    getMonthlyTrends(),
    getMonthlyTrendsByGenre(),
    getGenreComparisonTrends(),
    getPurchasesInMonth(year, month),
    getSalesInMonth(year, month),
  ]);

  const from = monthHref(year, month);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const isNextMonthInFuture = next.year * 12 + next.month > nowKey;
  const monthGroups = groupByGenreAndCharacter(monthPurchases, monthSales);
  const monthTotals = monthGroups.reduce(
    (acc, g) => ({ purchaseTotal: acc.purchaseTotal + g.purchaseTotal, saleTotal: acc.saleTotal + g.saleTotal }),
    { purchaseTotal: 0, saleTotal: 0 },
  );

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <h1 className="mb-6 text-xl font-semibold">통계</h1>

      {overall.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">구매/판매 기록이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-2 text-lg font-semibold">전체 월별 추이</h2>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <TrendLineChart points={overall} />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">월별 구매/판매 내역</h2>
            <div className="mb-4 flex items-center justify-between text-sm">
              <Link href={monthHref(prev.year, prev.month)} className="underline">
                ← 이전달
              </Link>
              <p className="font-medium">
                {year}년 {month}월
              </p>
              {isNextMonthInFuture ? (
                <span className="text-neutral-300 dark:text-neutral-700">다음달 →</span>
              ) : (
                <Link href={monthHref(next.year, next.month)} className="underline">
                  다음달 →
                </Link>
              )}
            </div>

            {monthGroups.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">이 달에는 구매/판매 기록이 없습니다.</p>
            ) : (
              <>
                <p className="mb-3 text-sm font-medium">
                  합계: 구매 {monthTotals.purchaseTotal.toLocaleString("ko-KR")}원 · 판매{" "}
                  {monthTotals.saleTotal.toLocaleString("ko-KR")}원
                </p>

                <ul className="mb-4 flex flex-col gap-2">
                  {monthGroups.map((genreGroup) => (
                    <li
                      key={genreGroup.genre}
                      className="flex flex-col gap-1 rounded-md border border-neutral-200 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
                    >
                      <span className="font-medium">{genreGroup.genre}</span>
                      <span className="text-neutral-500">
                        구매 {genreGroup.purchaseTotal.toLocaleString("ko-KR")}원 · 판매{" "}
                        {genreGroup.saleTotal.toLocaleString("ko-KR")}원
                      </span>
                    </li>
                  ))}
                </ul>

                <details>
                  <summary className="cursor-pointer text-sm underline">자세히 보기</summary>
                  <div className="mt-4 flex flex-col gap-4">
                    {monthGroups.map((genreGroup) => (
                      <div
                        key={genreGroup.genre}
                        className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                      >
                        <h3 className="mb-3 text-lg font-semibold">{genreGroup.genre}</h3>

                        <div className="flex flex-col gap-3">
                          {genreGroup.characters.map((characterGroup) => (
                            <div key={characterGroup.character}>
                              <h4 className="mb-2 text-base font-medium">
                                {characterGroup.character}
                              </h4>

                              {characterGroup.purchases.length > 0 && (
                                <ul className="mb-2 flex flex-col gap-2">
                                  {characterGroup.purchases.map((item) => (
                                    <li key={item.id}>
                                      <Link
                                        href={itemHref(item.id, from)}
                                        className="block rounded-md border border-neutral-200 border-l-4 border-l-blue-400 p-3 hover:opacity-70 dark:border-neutral-800 dark:border-l-blue-500"
                                      >
                                        <ItemCardContent {...item} showGenreCharacter={false} />
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {characterGroup.sales.length > 0 && (
                                <ul className="flex flex-col gap-2">
                                  {characterGroup.sales.map((sale) => {
                                    const profit = calcSaleProfit({
                                      quantitySold: sale.quantitySold,
                                      saleAmount: Number(sale.saleAmount),
                                      item: {
                                        price: Number(sale.item.price),
                                        shippingFee: Number(sale.item.shippingFee),
                                        quantity: sale.item.quantity,
                                      },
                                    });

                                    return (
                                      <li key={sale.id}>
                                        <Link
                                          href={itemHref(sale.itemId, from)}
                                          className="flex flex-col gap-1 rounded-md border border-neutral-200 border-l-4 border-l-green-400 p-3 hover:opacity-70 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:border-l-green-500"
                                        >
                                          <p className="text-sm">{sale.item.detail}</p>
                                          <p className="text-sm text-neutral-500">
                                            {sale.quantitySold}개 · {Number(sale.saleAmount).toLocaleString("ko-KR")}원
                                            · 손익{" "}
                                            <span
                                              className={`font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}
                                            >
                                              {profit >= 0 ? "+" : ""}
                                              {profit.toLocaleString("ko-KR")}원
                                            </span>
                                          </p>
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">장르별 구매 비교</h2>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <GenreComparisonChart months={comparison.months} series={comparison.purchase} />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">장르별 판매 비교</h2>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <GenreComparisonChart months={comparison.months} series={comparison.sale} />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">장르별 월별 추이</h2>
            <div className="flex flex-col gap-6">
              {byGenre.map((genre) => (
                <div key={genre.genre}>
                  <h3 className="mb-2 text-sm font-medium text-neutral-500">{genre.genre}</h3>
                  <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                    <TrendLineChart points={genre.points} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
