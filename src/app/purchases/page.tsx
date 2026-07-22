import Link from "next/link";
import { getRecentPurchases } from "@/lib/items";
import { BackButton } from "@/components/back-button";
import { ItemCardContent } from "@/components/item-card";
import { itemHref } from "@/lib/nav";

export default async function PurchasesPage() {
  const items = await getRecentPurchases();

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
      <h1 className="mb-6 text-xl font-semibold">구매 내역 (최신순)</h1>

      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">구매 기록이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {dateGroups.map(([dateStr, groupItems]) => (
            <div key={dateStr}>
              <h2 className="mb-2 text-base font-medium text-neutral-500">
                {groupItems[0].purchasedAt!.toLocaleDateString("ko-KR")}
              </h2>
              <ul className="flex flex-col gap-2">
                {groupItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={itemHref(item.id, "/purchases")}
                      className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
                    >
                      <ItemCardContent {...item} />
                    </Link>
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
                    <Link
                      href={itemHref(item.id, "/purchases")}
                      className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
                    >
                      <ItemCardContent {...item} />
                    </Link>
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
