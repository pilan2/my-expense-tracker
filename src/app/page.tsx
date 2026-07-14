import Link from "next/link";
import { getCategorySummary } from "@/lib/spending";
import { getUpcomingShipments, getRecentPurchases } from "@/lib/items";
import { getRecentSales, calcSaleProfit } from "@/lib/sales";
import { formatDDay, isOverdue } from "@/lib/dday";

export default async function Home() {
  const [summary, upcomingShipments, recentPurchases, recentSales] = await Promise.all([
    getCategorySummary(),
    getUpcomingShipments(),
    getRecentPurchases(5),
    getRecentSales(5),
  ]);

  const shipmentsByDate = new Map<string, typeof upcomingShipments>();
  for (const item of upcomingShipments) {
    const dateStr = item.expectedShipDate!.toISOString().slice(0, 10);
    if (!shipmentsByDate.has(dateStr)) shipmentsByDate.set(dateStr, []);
    shipmentsByDate.get(dateStr)!.push(item);
  }
  const shipmentDateGroups = [...shipmentsByDate.entries()].slice(0, 5);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">총 소비 금액</p>
          <p className="text-2xl font-semibold">{summary.totalPurchase.toLocaleString("ko-KR")}원</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">총 판매 금액</p>
          <p className="text-2xl font-semibold">{summary.totalSale.toLocaleString("ko-KR")}원</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">총 손익</p>
          <p className={`text-2xl font-semibold ${summary.totalProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {summary.totalProfit >= 0 ? "+" : ""}
            {summary.totalProfit.toLocaleString("ko-KR")}원
          </p>
        </div>
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
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm hover:opacity-70 dark:border-neutral-800"
                >
                  <span className="truncate">
                    {items
                      .slice(0, 3)
                      .map((item) => item.character)
                      .join(", ")}
                    {items.length > 3 ? ` 외 ${items.length - 3}개` : ""}
                  </span>
                  <span
                    className={`ml-2 shrink-0 font-medium ${isOverdue(items[0].expectedShipDate!) ? "text-red-600" : "text-blue-600"}`}
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
          {recentPurchases.length === 0 ? (
            <p className="text-sm text-neutral-500">구매 기록이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentPurchases.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm hover:opacity-70 dark:border-neutral-800"
                  >
                    <span>
                      {item.character} · {item.detail}
                    </span>
                    <span className="text-neutral-500">
                      {item.purchasedAt.toLocaleDateString("ko-KR")}
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
                      href={`/items/${sale.itemId}`}
                      className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm hover:opacity-70 dark:border-neutral-800"
                    >
                      <span>
                        {sale.item.character} · {sale.item.detail}
                      </span>
                      <span className={`font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
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
        <h2 className="mb-4 text-lg font-semibold">장르별 요약</h2>
        <ul className="flex flex-col gap-2">
          {summary.genres.map((genre) => (
            <li key={genre.name}>
              <Link
                href={`/browse/${encodeURIComponent(genre.name)}`}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-2 text-sm hover:opacity-70 dark:border-neutral-800"
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

      <Link
        href="/items"
        className="self-end rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        전체 품목 보기
      </Link>
    </div>
  );
}
