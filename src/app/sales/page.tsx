import Link from "next/link";
import { getRecentSales } from "@/lib/sales";
import { BackButton } from "@/components/back-button";

export default async function SalesPage() {
  const sales = await getRecentSales();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <BackButton />
      <h1 className="mb-6 text-xl font-semibold">판매 내역 (최신순)</h1>

      {sales.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">판매 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sales.map((sale) => (
            <li key={sale.id}>
              <Link
                href={`/items/${sale.itemId}`}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
              >
                <div>
                  <p className="font-medium">
                    {sale.item.genre} · {sale.item.character} · {sale.item.detail}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {sale.quantitySold}개 · {Number(sale.saleAmount).toLocaleString("ko-KR")}원
                  </p>
                </div>
                <span className="text-sm text-neutral-500">
                  {sale.saleDate.toLocaleDateString("ko-KR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
