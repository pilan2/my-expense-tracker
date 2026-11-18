import Link from "@/lib/local/navigation";
import { getRecentSales, calcSaleProfit } from "@/lib/sales";
import { BackButton } from "@/components/back-button";
import { itemHref } from "@/lib/nav";
import { won, signedWon } from "@/lib/money";
import { profitColor, EmptyState, PageHeader } from "@/components/ui";

export default  function SalesPage() {
  const sales = getRecentSales();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <PageHeader title="판매 내역 (최신순)" />

      {sales.length === 0 ? (
        <EmptyState>판매 기록이 없습니다.</EmptyState>
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
                      {sale.item.genre === sale.item.character
                        ? sale.item.genre
                        : `${sale.item.genre} · ${sale.item.character}`}
                      {sale.item.series ? ` (${sale.item.series})` : ""} · {sale.item.itemType} ·{" "}
                      {sale.item.detail}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {sale.quantitySold}개 · {won(Number(sale.saleAmount))} · 손익{" "}
                      <span className={`font-medium ${profitColor(profit)}`}>
                        {signedWon(profit)}
                      </span>
                    </p>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {sale.saleDate ? sale.saleDate.toLocaleDateString("ko-KR") : "날짜 모름"}
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
