import { redirect } from "next/navigation";
import { getItemsByIds } from "@/lib/items";
import { createBulkSale } from "@/lib/actions/sales";
import { BackButton } from "@/components/back-button";
import { NumberInput } from "@/components/number-input";
import { ClearableDateInput } from "@/components/clearable-date-input";

export default async function BulkSalePage({
  searchParams,
}: {
  searchParams: Promise<{ itemIds?: string | string[] }>;
}) {
  const { itemIds: itemIdsParam } = await searchParams;
  const itemIds = itemIdsParam ? (Array.isArray(itemIdsParam) ? itemIdsParam : [itemIdsParam]) : [];

  if (itemIds.length === 0) redirect("/items");

  const items = await getItemsByIds(itemIds);
  const sellable = items.filter((item) => item.remainingQuantity > 0);

  if (sellable.length < 2) {
    return (
      <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
        <BackButton href="/items" />
        <h1 className="mb-4 text-xl font-semibold">묶음 판매</h1>
        <p className="text-neutral-500">
          판매 가능한(잔여 수량이 있는) 품목이 2개 이상 선택되어야 묶음 판매를 등록할 수 있습니다.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href="/items" />
      <h1 className="mb-6 text-xl font-semibold">묶음 판매</h1>
      <form action={createBulkSale} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          {sellable.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <input type="hidden" name="itemIds" value={item.id} />
              <span>
                {item.character} · {item.detail} (잔여 {item.remainingQuantity})
              </span>
              <NumberInput
                name={`quantity_${item.id}`}
                min={1}
                max={item.remainingQuantity}
                defaultValue={item.remainingQuantity}
                required
                className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-center dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          ))}
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">총 판매 금액 (만원 단위, 선택한 품목 전체 총액)</span>
          <NumberInput
            name="totalSaleAmount"
            min={0}
            step={0.01}
            required
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">판매일 (모르면 비워두세요)</span>
          <ClearableDateInput
            name="saleDate"
            defaultValue={today}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          판매 등록
        </button>
      </form>
    </div>
  );
}
