import Link from "next/link";
import { notFound } from "next/navigation";
import { getItem } from "@/lib/items";
import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import { getSalesForItem, calcRemainingQuantity, calcProfit } from "@/lib/sales";
import { updateItem, deleteItem } from "@/lib/actions/items";
import { createSale, deleteSale } from "@/lib/actions/sales";
import { ItemForm, type ItemFormDefaults } from "@/components/item-form";
import { BackButton } from "@/components/back-button";
import { NumberInput } from "@/components/number-input";
import { ClearableDateInput } from "@/components/clearable-date-input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { wonToManwon } from "@/lib/money";
import { formatDDay, isOverdue } from "@/lib/dday";
import { safeRedirectTarget } from "@/lib/nav";

function selfHref(id: string, from: string, mode?: "edit") {
  const params = new URLSearchParams({ from });
  if (mode) params.set("mode", mode);
  return `/items/${id}?${params.toString()}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-neutral-100 pb-2 dark:border-neutral-900">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-base">{value}</span>
    </div>
  );
}

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; mode?: string }>;
}) {
  const { id } = await params;
  const { from: fromParam, mode } = await searchParams;
  const from = safeRedirectTarget(fromParam ?? "/items");
  const isEditing = mode === "edit";

  const [item, genreCatalog, itemTypeCatalog, sales] = await Promise.all([
    getItem(id),
    getGenreCatalog(),
    getItemTypeCatalog(),
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
    purchasedAt: item.purchasedAt ? item.purchasedAt.toISOString().slice(0, 10) : "",
    shippingFee: wonToManwon(item.shippingFee.toString()),
    hasOverseasShipping: item.hasOverseasShipping,
    maker: item.maker ?? "",
    organizer: item.organizer ?? "",
    isPhysical: item.isPhysical,
    expectedShipDate: item.expectedShipDate
      ? item.expectedShipDate.toISOString().slice(0, 10)
      : "",
    purchaseLink: item.purchaseLink ?? "",
    memo: item.memo ?? "",
    imageUrl: item.imageUrl,
  };

  const today = new Date().toISOString().slice(0, 10);
  const salesForCalc = sales.map((s) => ({ quantitySold: s.quantitySold, saleAmount: Number(s.saleAmount) }));
  const remaining = calcRemainingQuantity(item.quantity, salesForCalc);
  const profit = calcProfit(Number(item.price), Number(item.shippingFee), item.quantity, salesForCalc);

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href={isEditing ? selfHref(item.id, from) : from} />

      {isEditing ? (
        <>
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
            genreCatalog={genreCatalog}
            itemTypeCatalog={itemTypeCatalog}
            defaultValues={defaultValues}
          />
          <div className="mt-4">
            <Link href={selfHref(item.id, from)} className="text-sm underline">
              취소하고 보기로 돌아가기
            </Link>
          </div>
        </>
      ) : (
        <>
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="mb-4 max-h-80 w-full rounded-lg object-contain"
            />
          )}
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">품목 정보</h1>
            <Link
              href={selfHref(item.id, from, "edit")}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
            >
              수정
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <DetailRow
              label="장르 · 캐릭터"
              value={item.genre === item.character ? item.genre : `${item.genre} · ${item.character}`}
            />
            {item.series && <DetailRow label="시리즈" value={item.series} />}
            <DetailRow label="물품 종류" value={item.itemType} />
            <DetailRow label="세부사항" value={item.detail} />
            <DetailRow
              label="수량"
              value={remaining !== item.quantity ? `${item.quantity} (잔여 ${remaining})` : item.quantity}
            />
            <DetailRow label="가격" value={`${Number(item.price).toLocaleString("ko-KR")}원`} />
            <DetailRow
              label="구매일"
              value={item.purchasedAt ? item.purchasedAt.toLocaleDateString("ko-KR") : "모름"}
            />
            {Number(item.shippingFee) > 0 && (
              <DetailRow label="배송비" value={`${Number(item.shippingFee).toLocaleString("ko-KR")}원`} />
            )}
            {item.hasOverseasShipping && <DetailRow label="배송비" value="이후 계산 필요" />}
            {item.maker && <DetailRow label="제작한 사람" value={item.maker} />}
            {item.organizer && <DetailRow label="공구 개최한 사람" value={item.organizer} />}
            <DetailRow
              label="상태"
              value={
                item.isPhysical ? (
                  item.expectedShipDate
                    ? `현물 보유 중 (발송일 ${item.expectedShipDate.toLocaleDateString("ko-KR")})`
                    : "현물 보유 중"
                ) : item.expectedShipDate ? (
                  <>
                    발송예정 {item.expectedShipDate.toLocaleDateString("ko-KR")}{" "}
                    <span
                      className={`font-medium ${isOverdue(item.expectedShipDate) ? "text-red-600" : "text-blue-600"}`}
                    >
                      {formatDDay(item.expectedShipDate)}
                    </span>
                  </>
                ) : (
                  "-"
                )
              }
            />
            {item.purchaseLink && (
              <DetailRow
                label="구매처"
                value={
                  <a
                    href={item.purchaseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-600 underline dark:text-blue-400"
                  >
                    {item.purchaseLink}
                  </a>
                }
              />
            )}
            {item.memo && <DetailRow label="메모" value={<span className="whitespace-pre-wrap">{item.memo}</span>} />}
            {sales.length > 0 && (
              <DetailRow
                label="판매 손익"
                value={
                  <span className={`font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {profit >= 0 ? "+" : ""}
                    {profit.toLocaleString("ko-KR")}원
                  </span>
                }
              />
            )}
          </div>
        </>
      )}

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
              <span className="font-medium">판매 금액 (만원 단위, 전체 총액)</span>
              <NumberInput
                name="saleAmount"
                min={0}
                step={0.01}
                required
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">판매일 (날짜 기반 통계에 사용 가능)</span>
              <ClearableDateInput
                name="saleDate"
                defaultValue={today}
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
                  {sale.saleDate ? sale.saleDate.toLocaleDateString("ko-KR") : "날짜 모름"} · {sale.quantitySold}개 ·{" "}
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
