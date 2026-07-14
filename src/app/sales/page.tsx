import Link from "next/link";
import { getRecentSales, calcSaleProfit } from "@/lib/sales";
import { BackButton } from "@/components/back-button";
import { itemHref } from "@/lib/nav";

export default async function SalesPage() {
  const sales = await getRecentSales();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <h1 className="mb-6 text-xl font-semibold">판매 내역 (최신순)</h1>

      {sales.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">판매 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sales.map((sale) => {
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
                  href={itemHref(sale.itemId, "/sales")}
                  className="flex flex-col gap-1 rounded-md border border-neutral-200 p-3 hover:opacity-70 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
                >
                  <div>
                    <p className="font-medium">
                      {sale.item.genre} · {sale.item.character} · {sale.item.detail}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {sale.quantitySold}개 · {Number(sale.saleAmount).toLocaleString("ko-KR")}원 · 손익{" "}
                      <span className={`font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {profit >= 0 ? "+" : ""}
                        {profit.toLocaleString("ko-KR")}원
                      </span>
                    </p>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {sale.saleDate.toLocaleDateString("ko-KR")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
