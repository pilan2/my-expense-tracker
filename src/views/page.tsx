import { BudgetSummary } from "@/components/budget-summary";
import { BackupReminder } from "@/components/backup-status";
import { ItemThumb } from "@/components/item-card";
import Link from "@/lib/local/navigation";
import { getCategorySummary } from "@/lib/spending";
import { getItems, getUpcomingShipments, getRecentPurchases } from "@/lib/items";
import { getRecentSales, calcSaleProfit } from "@/lib/sales";
import { getCurrentMonthTotals } from "@/lib/trends";
import { isShipmentOverdue } from "@/lib/dday";
import { itemStatusChip } from "@/lib/item-status";
import { matchesItemFilter } from "@/lib/item-filter";
import { itemHref } from "@/lib/nav";
import { won, signedWon } from "@/lib/money";
import { profitColor, buttonClass, cardClass, chipClass, linkClass, saleColor, SectionHeader } from "@/components/ui";

export default function Home() {
  const [summary, items, upcomingShipments, recentPurchases, recentSales, currentMonth] = [
    getCategorySummary(),
    getItems(),
    getUpcomingShipments(),
    getRecentPurchases(6),
    getRecentSales(3),
    getCurrentMonthTotals(),
  ] as const;

  // 홈에서는 "지금 손이 가야 하는 것"만 칩으로 모아 해당 필터 목록으로 바로 보낸다.
  const todo = [
    { label: "수령 확인 대기", count: items.filter((item) => matchesItemFilter(item, "", "shipping")).length, href: "/items?status=shipping", chip: chipClass("ship") },
    { label: "배송비 미정", count: items.filter((item) => item.hasOverseasShipping).length, href: "/items?status=shipping-fee", chip: chipClass("fee") },
  ].filter((entry) => entry.count > 0);
  // 발송일이 지난 품목은 위의 "수령 확인 대기"로 보여주므로 여기서는 앞으로 올 것만.
  const upcoming = upcomingShipments.filter((item) => !isShipmentOverdue(item.expectedShipDate!, item.shipDateApprox)).slice(0, 8);
  const monthLabel = `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`;

  return (
    <div className="box-border mx-auto w-full max-w-3xl space-y-7 overflow-x-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{monthLabel}</p>
          <h1 className="text-2xl font-bold">홈</h1>
        </div>
        <Link href="/items/new" className={buttonClass()}>
          + 품목 등록
        </Link>
      </div>

      <BackupReminder />

      <BudgetSummary />

      {todo.length > 0 && (
        <section aria-label="확인할 것">
          <h2 className="mb-2 text-lg font-bold">확인할 것</h2>
          <div className="flex flex-wrap gap-2">
            {todo.map((entry) => (
              <Link key={entry.label} href={entry.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium shadow-card hover:bg-surface-soft">
                {entry.label} <span className={entry.chip}>{entry.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-label="이번 달 금액" className="grid grid-cols-2 gap-3">
        <div className={cardClass}>
          <p className="text-sm text-muted">이번 달 소비</p>
          <p className="text-xl font-bold">{won(currentMonth.purchaseTotal)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-muted">이번 달 판매</p>
          <p className={`text-xl font-bold ${saleColor}`}>{won(currentMonth.saleTotal)}</p>
        </div>
      </section>

      <section>
        <SectionHeader title="발송 예정" action={<Link href="/shipments" className={linkClass}>발송 일정 보기 →</Link>} />
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">발송을 기다리는 품목이 없습니다.</p>
        ) : (
          <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:px-6">
            {upcoming.map((item) => {
              const status = itemStatusChip(item);
              return (
                <li key={item.id} className="w-36 shrink-0">
                  <Link href={itemHref(item.id, "/")} className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-2.5 shadow-card hover:opacity-80">
                    <ItemThumb imageUrl={item.imageUrl} name={item.detail} seed={item.detail} className="aspect-[4/3] w-full rounded-xl text-2xl" />
                    {status && <span className={`self-start ${chipClass(status.kind)}`}>{status.label}</span>}
                    <span className="line-clamp-2 text-sm font-semibold leading-snug">{item.detail}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader title="최근 구매" action={<Link href="/purchases" className={linkClass}>전체 보기 →</Link>} />
        {recentPurchases.length === 0 ? (
          <p className="text-sm text-muted">구매 기록이 없습니다.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {recentPurchases.map((item) => (
              <li key={item.id}>
                <Link href={itemHref(item.id, "/")} className="flex flex-col gap-1 hover:opacity-80">
                  <ItemThumb imageUrl={item.imageUrl} name={item.detail} seed={item.detail} className="aspect-square w-full rounded-xl text-xl" />
                  <span className="truncate text-xs font-medium">{item.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader title="최근 판매" action={<Link href="/sales" className={linkClass}>전체 보기 →</Link>} />
        {recentSales.length === 0 ? (
          <p className="text-sm text-muted">판매 기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentSales.map((sale) => {
              const profit = calcSaleProfit({
                quantitySold: sale.quantitySold,
                saleAmount: Number(sale.saleAmount),
                item: { price: Number(sale.item.price), shippingFee: Number(sale.item.shippingFee), quantity: sale.item.quantity },
              });
              return (
                <li key={sale.id}>
                  <Link href={itemHref(sale.itemId, "/")} className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm shadow-card hover:bg-surface-soft">
                    <span className="min-w-0 truncate">{sale.item.detail}</span>
                    <span className={`shrink-0 font-semibold ${profitColor(profit)}`}>{signedWon(profit)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="전체 누적" className="space-y-3 rounded-2xl bg-surface-soft p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">전체 누적</h2>
          <Link href="/stats" className={linkClass}>통계 자세히 보기 →</Link>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div><dt className="text-muted">소비</dt><dd className="font-semibold">{won(summary.totalPurchase)}</dd></div>
          <div><dt className="text-muted">판매</dt><dd className={`font-semibold ${saleColor}`}>{won(summary.totalSale)}</dd></div>
          <div><dt className="text-muted">손익</dt><dd className={`font-semibold ${profitColor(summary.totalProfit)}`}>{signedWon(summary.totalProfit)}</dd></div>
        </dl>
        {summary.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {summary.genres.map((genre) => (
              <Link key={genre.name} href={`/browse/${encodeURIComponent(genre.name)}`} className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-sm hover:bg-accent-soft">
                {genre.name}
              </Link>
            ))}
            <Link href="/browse/makers" className="inline-flex min-h-9 items-center rounded-full border border-dashed border-line px-3 text-sm text-muted">제작자별</Link>
          </div>
        )}
      </section>
    </div>
  );
}
