import Link from "next/link";
import { getUpcomingShipments } from "@/lib/items";
import { BackButton } from "@/components/back-button";
import { formatDDay, isOverdue } from "@/lib/dday";

export default async function ShipmentsPage() {
  const items = await getUpcomingShipments();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <BackButton />
      <h1 className="mb-6 text-xl font-semibold">발송 예정 전체</h1>

      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">발송 예정인 품목이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/items/${item.id}`}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
              >
                <div>
                  <p className="font-medium">
                    {item.genre} · {item.character} · {item.detail}
                  </p>
                  <p className="text-sm text-neutral-500">
                    발송예정 {item.expectedShipDate!.toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <span
                  className={`font-medium ${isOverdue(item.expectedShipDate!) ? "text-red-600" : "text-blue-600"}`}
                >
                  {formatDDay(item.expectedShipDate!)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
