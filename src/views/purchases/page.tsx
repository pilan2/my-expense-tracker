import { getRecentPurchases } from "@/lib/items";
import { BackButton } from "@/components/back-button";
import { ItemCardWithDelivery } from "@/components/item-card-with-delivery";
import { itemHref } from "@/lib/nav";
import { EmptyState, PageHeader } from "@/components/ui";

export default  function PurchasesPage() {
  const items = getRecentPurchases();

  const knownItems = items.filter((item) => item.purchasedAt);
  const unknownItems = items.filter((item) => !item.purchasedAt);

  const dateMap = new Map<string, typeof items>();
  for (const item of knownItems) {
    const dateStr = item.purchasedAt!.toISOString().slice(0, 10);
    if (!dateMap.has(dateStr)) dateMap.set(dateStr, []);
    dateMap.get(dateStr)!.push(item);
  }
  const dateGroups = [...dateMap.entries()];

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <PageHeader title="구매 내역 (최신순)" />

      {items.length === 0 ? (
        <EmptyState>구매 기록이 없습니다.</EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {dateGroups.map(([dateStr, groupItems]) => (
            <div key={dateStr}>
              <h2 id={`d-${dateStr}`} className="mb-2 scroll-mt-4 text-base font-medium text-neutral-500">
                {groupItems[0].purchasedAt!.toLocaleDateString("ko-KR")}
              </h2>
              <ul className="flex flex-col gap-2">
                {groupItems.map((item) => (
                  <li key={item.id}>
                    <ItemCardWithDelivery {...item} href={itemHref(item.id, "/purchases")}
                      className="block rounded-md border border-neutral-200 p-3 dark:border-neutral-800" />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {unknownItems.length > 0 && (
            <div>
              <h2 className="mb-2 text-base font-medium text-neutral-500">날짜 모름</h2>
              <ul className="flex flex-col gap-2">
                {unknownItems.map((item) => (
                  <li key={item.id}>
                    <ItemCardWithDelivery {...item} href={itemHref(item.id, "/purchases")}
                      className="block rounded-md border border-neutral-200 p-3 dark:border-neutral-800" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
