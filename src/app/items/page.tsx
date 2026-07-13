import Link from "next/link";
import { getItems } from "@/lib/items";

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">품목 목록</h1>
        <Link
          href="/items/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          + 품목 등록
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">등록된 품목이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/items/${item.id}`}
                className="flex items-center justify-between py-3 hover:opacity-70"
              >
                <div>
                  <p className="font-medium">
                    {item.genre} · {item.character}
                    {item.series ? ` (${item.series})` : ""} · {item.itemType} · {item.detail}
                  </p>
                  <p className="text-sm text-neutral-500">
                    수량 {item.quantity} · {Number(item.price).toLocaleString("ko-KR")}원
                    {item.isPhysical
                      ? " · 현물"
                      : item.expectedShipDate
                        ? ` · 발송예정 ${item.expectedShipDate.toLocaleDateString("ko-KR")}`
                        : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
