import { BudgetSummary } from "@/components/budget-summary";
import Link from "@/lib/local/navigation";
import { getCategorySummary } from "@/lib/spending";
import { getUpcomingShipments, getRecentPurchases } from "@/lib/items";
import { getRecentSales, calcSaleProfit } from "@/lib/sales";
import { getCurrentMonthTotals } from "@/lib/trends";
import { formatShipDDay } from "@/lib/dday";
import { itemHref } from "@/lib/nav";
import { won, signedWon } from "@/lib/money";
import { profitColor, buttonClass, cardClass, linkClass, saleColor, SectionHeader } from "@/components/ui";

const rowClass = "flex min-h-11 items-start justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900";

export default  function Home() {
  const [summary, upcomingShipments, recentPurchases, recentSales, currentMonth] = [
    getCategorySummary(),
    getUpcomingShipments(),
    getRecentPurchases(),
    getRecentSales(5),
    getCurrentMonthTotals(),
  ] as const;

  const shipmentsByDate = new Map<string, typeof upcomingShipments>();
  for (const item of upcomingShipments) {
    const dateStr = item.expectedShipDate!.toISOString().slice(0, 10);
    if (!shipmentsByDate.has(dateStr)) shipmentsByDate.set(dateStr, []);
    shipmentsByDate.get(dateStr)!.push(item);
  }
  const shipmentDateGroups = [...shipmentsByDate.entries()].slice(0, 5);

  // getRecentPurchases()는 날짜 없는 품목도 맨 뒤에 포함해서 전부 돌려주므로(전체보기용),
  // 미리보기에서는 날짜 있는 것만 쓰고 날짜순으로 최근 5개 "날짜"까지 모은다(품목 개수가
  // 아니라 날짜 기준이라, 하루에 여러 개를 샀어도 그 날짜 그룹이 잘리지 않는다).
  const purchasesByDate = new Map<string, typeof recentPurchases>();
  for (const item of recentPurchases) {
    if (!item.purchasedAt) continue;
    const dateStr = item.purchasedAt.toISOString().slice(0, 10);
    if (!purchasesByDate.has(dateStr)) purchasesByDate.set(dateStr, []);
    purchasesByDate.get(dateStr)!.push(item);
  }
  const purchaseDateGroups = [...purchasesByDate.entries()].slice(0, 5);

  return (
    <div className="box-border mx-auto w-full max-w-3xl space-y-8 overflow-x-hidden p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">홈</h1>
        <Link href="/items/new" className={buttonClass()}>
          + 품목 등록
        </Link>
      </div>

      <BudgetSummary />

      <section aria-label="이번 달 금액" className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className={cardClass}>
          <p className="text-sm text-neutral-500">이번 달 소비</p>
          <p className="text-xl font-semibold sm:text-2xl">{won(currentMonth.purchaseTotal)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-neutral-500">이번 달 판매</p>
          <p className={`text-xl font-semibold sm:text-2xl ${saleColor}`}>{won(currentMonth.saleTotal)}</p>
        </div>
      </section>

      <section aria-label="전체 누적" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <p className="text-neutral-500">
          전체 누적 · 소비 <span className="font-medium text-neutral-900 dark:text-neutral-100">{won(summary.totalPurchase)}</span>
          {" "}· 판매 <span className={`font-medium ${saleColor}`}>{won(summary.totalSale)}</span>
          {" "}· 손익 <span className={`font-medium ${profitColor(summary.totalProfit)}`}>{signedWon(summary.totalProfit)}</span>
        </p>
        <Link href="/stats" className={linkClass}>통계 자세히 보기 →</Link>
      </section>

      <section>
        <SectionHeader title="발송 예정" action={<Link href="/shipments" className={linkClass}>발송 일정 보기 →</Link>} />
        {shipmentDateGroups.length === 0 ? (
          <p className="text-sm text-neutral-500">발송을 기다리는 품목이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shipmentDateGroups.map(([dateStr, items]) => (
              <li key={dateStr}>
                <Link
                  // 월 단위 발송일은 날짜별 보기에 나오지 않으므로 그 달 달력으로 보낸다.
                  href={items[0].shipDateApprox ? `/shipments?view=calendar&month=${dateStr.slice(0, 7)}` : `/shipments?view=day&date=${dateStr}`}
                  className={rowClass}
                >
                  <span>
                    {items
                      .slice(0, 2)
                      .map((item) => `${item.character} · ${item.detail}`)
                      .join(", ")}
                    {items.length > 2 ? ` 외 ${items.length - 2}개` : ""}
                  </span>
                  <span className="shrink-0 font-medium text-blue-600 dark:text-blue-400">
                    {formatShipDDay(items[0].expectedShipDate!, items[0].shipDateApprox)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <SectionHeader title="최근 구매" action={<Link href="/purchases" className={linkClass}>전체보기 →</Link>} />
          {purchaseDateGroups.length === 0 ? (
            <p className="text-sm text-neutral-500">구매 기록이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {purchaseDateGroups.map(([dateStr, items]) => (
                <li key={dateStr}>
                  <Link
                    href={`/purchases#d-${dateStr}`}
                    className={rowClass}
                  >
                    <span>
                      {items
                        .slice(0, 2)
                        .map((item) => `${item.character} · ${item.detail}`)
                        .join(", ")}
                      {items.length > 2 ? ` 외 ${items.length - 2}개` : ""}
                    </span>
                    <span className="shrink-0 text-neutral-500">
                      {items[0].purchasedAt!.toLocaleDateString("ko-KR")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <SectionHeader title="최근 판매" action={<Link href="/sales" className={linkClass}>전체보기 →</Link>} />
          {recentSales.length === 0 ? (
            <p className="text-sm text-neutral-500">판매 기록이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentSales.map((sale) => {
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
                      href={itemHref(sale.itemId, "/")}
                      className={`${rowClass} flex-col sm:flex-row sm:items-center`}
                    >
                      <span className="min-w-0 truncate">
                        {sale.item.character} · {sale.item.detail}
                      </span>
                      <span
                        className={`shrink-0 font-medium ${profitColor(profit)}`}
                      >
                        {signedWon(profit)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div>
        <SectionHeader title="장르별로 보기" action={<Link href="/browse/makers" className={linkClass}>제작자별로 보기 →</Link>} />
        <ul className="flex flex-col gap-2">
          {summary.genres.map((genre) => (
            <li key={genre.name}>
              <Link
                href={`/browse/${encodeURIComponent(genre.name)}`}
                className={`${rowClass} flex-col sm:flex-row sm:items-center`}
              >
                <span className="font-medium">{genre.name}</span>
                <span className="text-neutral-500">
                  구매 {won(genre.purchaseTotal)} · 판매{" "}
                  {won(genre.saleTotal)}
                  {genre.saleTotal > 0 && (
                    <>
                      {" · 손익 "}
                      <span className={`font-medium ${profitColor(genre.profit)}`}>
                        {signedWon(genre.profit)}
                      </span>
                    </>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
