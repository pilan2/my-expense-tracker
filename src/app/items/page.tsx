import Link from "next/link";
import { getItems } from "@/lib/items";
import { assignShippingFee } from "@/lib/actions/shipping";
import { BackButton } from "@/components/back-button";
import { NumberInput } from "@/components/number-input";

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <BackButton />
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
        <form action={assignShippingFee}>
          <div className="mb-4 flex items-end gap-3 rounded-md border border-neutral-200 p-4 text-sm dark:border-neutral-800">
            <label className="flex flex-1 flex-col gap-1">
              <span className="font-medium">
                아래에서 같이 배송받은 품목을 체크하고, 총 배송비(만원 단위)를 입력하면 각
                품목의 수량 비율대로 나눠서 배정됩니다.
              </span>
              <NumberInput
                name="totalShippingFee"
                min={0}
                step={0.01}
                className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
            >
              배송비 나누기
            </button>
          </div>

          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <input type="checkbox" name="itemIds" value={item.id} className="h-4 w-4" />
                <Link
                  href={`/items/${item.id}`}
                  className="flex flex-1 items-center justify-between hover:opacity-70"
                >
                  <div>
                    <p className="font-medium">
                      {item.genre} · {item.character}
                      {item.series ? ` (${item.series})` : ""} · {item.itemType} · {item.detail}
                    </p>
                    <p className="text-sm text-neutral-500">
                      수량 {item.quantity}
                      {item.remainingQuantity !== item.quantity
                        ? ` (잔여 ${item.remainingQuantity})`
                        : ""}{" "}
                      · {Number(item.price).toLocaleString("ko-KR")}원
                      {Number(item.shippingFee) > 0
                        ? ` (+배송비 ${Number(item.shippingFee).toLocaleString("ko-KR")}원)`
                        : ""}
                      {item.remainingQuantity === 0
                        ? " · 판매 완료"
                        : item.isPhysical
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
        </form>
      )}
    </div>
  );
}
