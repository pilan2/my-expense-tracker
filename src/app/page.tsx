import Link from "next/link";
import { getCategorySummary } from "@/lib/spending";
import { getUpcomingShipments, getRecentPurchases } from "@/lib/items";
import { getRecentSales, calcSaleProfit } from "@/lib/sales";
import { getCurrentMonthTotals } from "@/lib/trends";
import { formatDDay, isOverdue } from "@/lib/dday";
import { itemHref } from "@/lib/nav";

export default async function Home() {
  const [summary, upcomingShipments, recentPurchases, recentSales, currentMonth] = await Promise.all([
    getCategorySummary(),
    getUpcomingShipments(),
    getRecentPurchases(),
    getRecentSales(5),
    getCurrentMonthTotals(),
  ]);

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
      <div className="flex justify-end gap-2">
        <Link
          href="/items"
          className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          전체 품목 보기
        </Link>
        <Link
          href="/items/new"
          className="inline-block rounded-md border border-neutral-300 px-4 py-2 text-sm hover:opacity-70 dark:border-neutral-700"
        >
          + 품목 등록
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-lg border border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">총 소비 금액</p>
          <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 sm:text-2xl">
            {summary.totalPurchase.toLocaleString("ko-KR")}원
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">총 판매 금액</p>
          <p className="text-xl font-semibold text-green-600 dark:text-green-400 sm:text-2xl">
            {summary.totalSale.toLocaleString("ko-KR")}원
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-neutral-200 p-4 sm:col-span-1 sm:p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">총 손익</p>
          <p className={`text-xl font-semibold sm:text-2xl ${summary.totalProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {summary.totalProfit >= 0 ? "+" : ""}
            {summary.totalProfit.toLocaleString("ko-KR")}원
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-lg border border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">이번 달 소비 금액</p>
          <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 sm:text-2xl">
            {currentMonth.purchaseTotal.toLocaleString("ko-KR")}원
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">이번 달 판매 금액</p>
          <p className="text-xl font-semibold text-green-600 dark:text-green-400 sm:text-2xl">
            {currentMonth.saleTotal.toLocaleString("ko-KR")}원
          </p>
        </div>
      </div>

      <div className="text-right text-sm">
        <Link href="/stats" className="underline">
          통계 자세히 보기 →
        </Link>
      </div>

      {upcomingShipments.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">발송 예정</h2>
            <Link href="/shipments" className="text-sm underline">
              전체보기 →
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {shipmentDateGroups.map(([dateStr, items]) => (
              <li key={dateStr}>
                <Link
                  href={`/shipments?view=day&date=${dateStr}`}
                  className="flex items-start justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm hover:opacity-70 dark:border-neutral-800"
                >
                  <span>
                    {items
                      .slice(0, 2)
                      .map((item) => `${item.character} · ${item.detail}`)
                      .join(", ")}
                    {items.length > 2 ? ` 외 ${items.length - 2}개` : ""}
                  </span>
                  <span
                    className={`shrink-0 font-medium ${isOverdue(items[0].expectedShipDate!) ? "text-red-600" : "text-blue-600"}`}
                  >
                    {formatDDay(items[0].expectedShipDate!)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">최근 구매</h2>
            <Link href="/purchases" className="text-sm underline">
              전체보기 →
            </Link>
          </div>
          {purchaseDateGroups.length === 0 ? (
            <p className="text-sm text-neutral-500">구매 기록이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {purchaseDateGroups.map(([dateStr, items]) => (
                <li key={dateStr}>
                  <Link
                    href="/purchases"
                    className="flex items-start justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm hover:opacity-70 dark:border-neutral-800"
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">최근 판매</h2>
            <Link href="/sales" className="text-sm underline">
              전체보기 →
            </Link>
          </div>
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
                      className="flex flex-col gap-1 rounded-md border border-neutral-200 px-3 py-2 text-sm hover:opacity-70 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
                    >
                      <span className="min-w-0 truncate">
                        {sale.item.character} · {sale.item.detail}
                      </span>
                      <span
                        className={`shrink-0 font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}
                      >
                        {profit >= 0 ? "+" : ""}
                        {profit.toLocaleString("ko-KR")}원
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">장르별로 보기</h2>
          <Link href="/browse/makers" className="text-sm underline">
            제작자별로 보기 →
          </Link>
        </div>
        <ul className="flex flex-col gap-2">
          {summary.genres.map((genre) => (
            <li key={genre.name}>
              <Link
                href={`/browse/${encodeURIComponent(genre.name)}`}
                className="flex flex-col gap-1 rounded-md border border-neutral-200 px-4 py-2 text-sm hover:opacity-70 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
              >
                <span className="font-medium">{genre.name}</span>
                <span className="text-neutral-500">
                  구매 {genre.purchaseTotal.toLocaleString("ko-KR")}원 · 판매{" "}
                  {genre.saleTotal.toLocaleString("ko-KR")}원
                  {genre.saleTotal > 0 && (
                    <>
                      {" · 손익 "}
                      <span className={`font-medium ${genre.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {genre.profit >= 0 ? "+" : ""}
                        {genre.profit.toLocaleString("ko-KR")}원
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
