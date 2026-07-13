import Link from "next/link";
import { getCategorySummary } from "@/lib/spending";
import { getUpcomingShipments } from "@/lib/items";
import { formatDDay, isOverdue } from "@/lib/dday";

export default async function Home() {
  const [summary, upcomingShipments] = await Promise.all([
    getCategorySummary(),
    getUpcomingShipments(5),
  ]);

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
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {upcomingShipments.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <Link href={`/items/${item.id}`} className="hover:opacity-70">
                  {item.genre} · {item.character} · {item.detail}
                </Link>
                <span
                  className={`font-medium ${
                    isOverdue(item.expectedShipDate!) ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {formatDDay(item.expectedShipDate!)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">장르별 요약</h2>
          <Link href="/browse" className="text-sm underline">
            카테고리별 자세히 보기 →
          </Link>
        </div>
        <ul className="flex flex-col gap-2">
          {summary.genres.slice(0, 5).map((genre) => (
            <li
              key={genre.name}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800"
            >
              <span className="font-medium">{genre.name}</span>
              <span className="text-neutral-500">
                구매 {genre.purchaseTotal.toLocaleString("ko-KR")}원 · 판매{" "}
                {genre.saleTotal.toLocaleString("ko-KR")}원
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/items"
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        전체 품목 보기
      </Link>
    </div>
  );
}
