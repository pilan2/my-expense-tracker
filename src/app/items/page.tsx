import Link from "next/link";
import { getItems } from "@/lib/items";
import { assignShippingFee } from "@/lib/actions/shipping";
import { BackButton } from "@/components/back-button";
import { NumberInput } from "@/components/number-input";
import { ItemCardContent } from "@/components/item-card";
import { itemHref } from "@/lib/nav";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const { pending } = await searchParams;
  const pendingOnly = pending === "1";

  const items = await getItems({ pendingShippingOnly: pendingOnly });

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{pendingOnly ? "배송비 미정 품목" : "전체 품목"}</h1>
        <Link
          href="/items/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          + 품목 등록
        </Link>
      </div>
      <div className="mb-6 flex gap-4 text-sm">
        <Link href={pendingOnly ? "/items" : "/items?pending=1"} className="underline">
          {pendingOnly ? "전체보기" : "배송비 미정만 보기"} →
        </Link>
        <Link href="/catalog" className="underline">
          장르/캐릭터 관리 →
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">
          {pendingOnly ? "배송비 미정인 품목이 없습니다." : "등록된 품목이 없습니다."}
        </p>
      ) : (
        <form action={assignShippingFee}>
          <div className="mb-4 flex flex-col gap-3 rounded-md border border-neutral-200 p-4 text-sm sm:flex-row sm:items-end dark:border-neutral-800">
            {pendingOnly && (
              <label className="flex flex-1 flex-col gap-1">
                <span className="font-medium">
                  아래에서 같이 배송받은 품목을 체크하고, 총 배송비(만원 단위)를 입력하면 각
                  품목의 수량 비율대로 나눠서 배정됩니다.
                </span>
                <NumberInput
                  name="totalShippingFee"
                  min={0}
                  step={0.0001}
                  className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            )}
            <div className="flex gap-2">
              {pendingOnly && (
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  배송비 나누기
                </button>
              )}
              <button
                type="submit"
                formMethod="get"
                formAction="/items/bulk-sale"
                className="rounded-md border border-neutral-300 px-4 py-2 hover:opacity-70 dark:border-neutral-700"
              >
                묶음 판매
              </button>
            </div>
          </div>

          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <input type="checkbox" name="itemIds" value={item.id} className="mt-1 h-4 w-4" />
                <Link
                  href={itemHref(item.id, pendingOnly ? "/items?pending=1" : "/items")}
                  className="flex-1 hover:opacity-70"
                >
                  <ItemCardContent {...item} />
                </Link>
              </li>
            ))}
          </ul>
        </form>
      )}
    </div>
  );
}
