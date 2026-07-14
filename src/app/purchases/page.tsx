import Link from "next/link";
import { getRecentPurchases } from "@/lib/items";
import { BackButton } from "@/components/back-button";
import { ItemCardContent } from "@/components/item-card";

export default async function PurchasesPage() {
  const items = await getRecentPurchases();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <BackButton />
      <h1 className="mb-6 text-xl font-semibold">구매 내역 (최신순)</h1>

      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">구매 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/items/${item.id}`}
                className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
              >
                <p className="mb-1 text-xs text-neutral-500">
                  구매일 {item.purchasedAt.toLocaleDateString("ko-KR")}
                </p>
                <ItemCardContent {...item} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
