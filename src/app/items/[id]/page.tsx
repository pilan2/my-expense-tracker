import { notFound } from "next/navigation";
import { getItem, getFieldSuggestions } from "@/lib/items";
import { getSalesForItem, calcRemainingQuantity, calcProfit } from "@/lib/sales";
import { updateItem, deleteItem } from "@/lib/actions/items";
import { createSale, deleteSale } from "@/lib/actions/sales";
import { ItemForm, type ItemFormDefaults } from "@/components/item-form";
import { BackButton } from "@/components/back-button";
import { NumberInput } from "@/components/number-input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { wonToManwon } from "@/lib/money";
import { formatDDay, isOverdue } from "@/lib/dday";
import { safeRedirectTarget } from "@/lib/nav";

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from: fromParam } = await searchParams;
  const from = safeRedirectTarget(fromParam ?? "/items");
  const [item, suggestions, sales] = await Promise.all([
    getItem(id),
    getFieldSuggestions(),
    getSalesForItem(id),
  ]);

  if (!item) notFound();

  const defaultValues: ItemFormDefaults = {
    genre: item.genre,
    character: item.character,
    series: item.series ?? "",
    itemType: item.itemType,
    detail: item.detail,
    quantity: item.quantity,
    price: wonToManwon(item.price.toString()),
    purchasedAt: item.purchasedAt.toISOString().slice(0, 10),
    shippingFee: wonToManwon(item.shippingFee.toString()),
    hasOverseasShipping: item.hasOverseasShipping,
    maker: item.maker ?? "",
    organizer: item.organizer ?? "",
    isPhysical: item.isPhysical,
    expectedShipDate: item.expectedShipDate
      ? item.expectedShipDate.toISOString().slice(0, 10)
      : "",
  };

  const today = new Date().toISOString().slice(0, 10);
  const salesForCalc = sales.map((s) => ({ quantitySold: s.quantitySold, saleAmount: Number(s.saleAmount) }));
  const remaining = calcRemainingQuantity(item.quantity, salesForCalc);
  const profit = calcProfit(Number(item.price), Number(item.shippingFee), item.quantity, salesForCalc);

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href={from} />
      <h1 className="mb-2 text-xl font-semibold">품목 수정</h1>
      {!item.isPhysical && item.expectedShipDate && (
        <p className="mb-6 text-sm">
          발송예정 {item.expectedShipDate.toLocaleDateString("ko-KR")} ·{" "}
          <span className={`font-medium ${isOverdue(item.expectedShipDate) ? "text-red-600" : "text-blue-600"}`}>
            {formatDDay(item.expectedShipDate)}
          </span>
          {isOverdue(item.expectedShipDate) && " (곧 자동으로 현물 전환됩니다)"}
        </p>
      )}
      <ItemForm
        action={updateItem.bind(null, item.id, from)}
        suggestions={suggestions}
        defaultValues={defaultValues}
      />

      <form action={deleteItem.bind(null, item.id, from)} className="mt-8 border-t pt-6 dark:border-neutral-800">
        <ConfirmSubmitButton
          confirmMessage="이 품목을 삭제하시겠습니까? 연결된 판매 이력도 함께 삭제됩니다."
          className="text-sm text-red-600 hover:underline"
        >
          이 품목 삭제
        </ConfirmSubmitButton>
      </form>

      <div className="mt-8 border-t pt-6 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">판매 관리</h2>
        <div className="mb-4 text-sm text-neutral-500">
          <p>
            구매 수량 {item.quantity} · 잔여 수량{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{remaining}</span>
          </p>
          {sales.length > 0 && (
            <p>
              판매 손익:{" "}
              <span className={`font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {profit >= 0 ? "+" : ""}
                {profit.toLocaleString("ko-KR")}원
              </span>
            </p>
          )}
        </div>

        {remaining > 0 ? (
          <form action={createSale.bind(null, item.id)} className="mb-6 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">판매 수량</span>
              <NumberInput
                name="quantitySold"
                min={1}
                max={remaining}
                defaultValue={1}
                required
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">판매 금액 (만원 단위, 이 건 전체 총액)</span>
              <NumberInput
                name="saleAmount"
                min={0}
                step={0.01}
                required
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">판매일</span>
              <input
                name="saleDate"
                type="date"
                defaultValue={today}
                required
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <button
              type="submit"
              className="mt-1 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
            >
              판매 등록
            </button>
          </form>
        ) : (
          <p className="mb-6 text-sm text-neutral-500">모두 판매되었습니다.</p>
        )}

        {sales.length > 0 && (
          <ul className="divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            {sales.map((sale) => (
              <li key={sale.id} className="flex items-center justify-between py-2">
                <span>
                  {sale.saleDate.toLocaleDateString("ko-KR")} · {sale.quantitySold}개 ·{" "}
                  {Number(sale.saleAmount).toLocaleString("ko-KR")}원
                </span>
                <form action={deleteSale.bind(null, sale.id)}>
                  <ConfirmSubmitButton
                    confirmMessage="이 판매 기록을 삭제하시겠습니까?"
                    className="text-red-600 hover:underline"
                  >
                    삭제
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
