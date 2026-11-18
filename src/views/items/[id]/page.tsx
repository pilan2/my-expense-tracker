
import { LocalImage } from "@/components/local-image";
import { LocalForm } from "@/components/local-form";
import Link from "@/lib/local/navigation";
import { notFound } from "@/lib/local/navigation";
import { getItem, getSameProductItems, getSameProductCandidates } from "@/lib/items";
import { SameProductSection } from "@/components/same-product-section";
import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import { getSalesForItem, calcRemainingQuantity, calcProfit } from "@/lib/sales";
import { updateItem, deleteItem, confirmDelivery } from "@/lib/actions/items";
import { createSale, deleteSale } from "@/lib/actions/sales";
import { ItemForm, type ItemFormDefaults } from "@/components/item-form";
import { BackButton } from "@/components/back-button";
import { NumberInput } from "@/components/number-input";
import { ClearableDateInput } from "@/components/clearable-date-input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { wonToManwon, won, signedWon } from "@/lib/money";
import { formatShipDDay, formatShipDateLabel, isShipmentOverdue } from "@/lib/dday";
import { safeRedirectTarget } from "@/lib/nav";
import { profitColor, buttonClass, inputClass, linkClass, warningColor, SectionHeader } from "@/components/ui";
import { ManwonInput } from "@/components/manwon-input";

function selfHref(id: string, from: string, mode?: "edit") {
  const params = new URLSearchParams({ from });
  if (mode) params.set("mode", mode);
  return `/items/${id}?${params.toString()}`;
}

export default  function ItemDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; mode?: string };
}) {
  const { id } = params;
  const { from: fromParam, mode } = searchParams;
  const from = safeRedirectTarget(fromParam ?? "/items");
  const isEditing = mode === "edit";

  const [item, genreCatalog, itemTypeCatalog, sales] = [
    getItem(id),
    getGenreCatalog(),
    getItemTypeCatalog(),
    getSalesForItem(id),
  ] as const;

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
    expectedShipDate:
      item.expectedShipDate && !item.shipDateApprox ? item.expectedShipDate.toISOString().slice(0, 10) : "",
    expectedShipMonth:
      item.expectedShipDate && item.shipDateApprox ? item.expectedShipDate.toISOString().slice(0, 7) : "",
    shipDateApprox: item.shipDateApprox,
    purchaseLink: item.purchaseLink ?? "",
    memo: item.memo ?? "",
    imageUrl: item.imageUrl,
  };

  const today = new Date().toISOString().slice(0, 10);
  const salesForCalc = sales.map((s) => ({ quantitySold: s.quantitySold, saleAmount: Number(s.saleAmount) }));
  const remaining = calcRemainingQuantity(item.quantity, salesForCalc);
  const profit = calcProfit(Number(item.price), Number(item.shippingFee), item.quantity, salesForCalc);

  const deleteForm = (
    <LocalForm action={deleteItem.bind(null, item.id, from)} className="mt-10 border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <ConfirmSubmitButton
        confirmMessage="이 품목을 삭제할까요? 연결된 판매 이력과 행사 체크리스트 항목도 함께 삭제됩니다."
        className={buttonClass("dangerGhost")}
      >
        이 품목 삭제
      </ConfirmSubmitButton>
    </LocalForm>
  );

  if (isEditing) {
    return (
      <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
        <BackButton href={selfHref(item.id, from)} />
        <h1 className="mb-2 text-xl font-semibold">품목 수정</h1>
        <div className="mb-6 text-sm"><ItemStatus item={item} remaining={remaining} showDeliveryAction={false} /></div>
        <ItemForm
          action={updateItem.bind(null, item.id, from)}
          genreCatalog={genreCatalog}
          itemTypeCatalog={itemTypeCatalog}
          defaultValues={defaultValues}
          itemId={item.id}
        />
        <div className="mt-4">
          <Link href={selfHref(item.id, from)} className={linkClass}>
            취소하고 보기로 돌아가기
          </Link>
        </div>
        {deleteForm}
      </div>
    );
  }

  const total = Number(item.price) * item.quantity + Number(item.shippingFee);

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href={from} />

      {item.imageUrl && (
        <LocalImage src={item.imageUrl} alt="" className="mb-4 max-h-80 w-full rounded-lg object-contain" />
      )}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap gap-x-1 text-sm text-neutral-500">
            <span>{item.genre === item.character ? item.genre : `${item.genre} · ${item.character}`}</span>
            {item.series && <span>({item.series})</span>}
            <span>· {item.itemType}</span>
          </p>
          <h1 className="break-words text-xl font-semibold">{item.detail}</h1>
        </div>
        <Link href={selfHref(item.id, from, "edit")} className={`shrink-0 ${buttonClass("secondary")}`}>
          수정
        </Link>
      </div>
      <div className="mb-6 text-sm"><ItemStatus item={item} remaining={remaining} showDeliveryAction /></div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <Info label="수량" value={remaining !== item.quantity ? `${item.quantity} (잔여 ${remaining})` : item.quantity} />
        <Info label="단가" value={won(Number(item.price))} />
        <Info label="구매일" value={item.purchasedAt ? item.purchasedAt.toLocaleDateString("ko-KR") : "모름"} />
        <Info label="배송비" value={item.hasOverseasShipping ? <span className={warningColor}>이후 계산 필요</span> : won(Number(item.shippingFee))} />
        <Info label="총 구매 금액" value={won(total)} />
        {sales.length > 0 && <Info label="판매 손익" value={<span className={`font-medium ${profitColor(profit)}`}>{signedWon(profit)}</span>} />}
        {item.maker && <Info label="제작한 사람" value={item.maker} />}
        {item.organizer && <Info label="공구 개최한 사람" value={item.organizer} />}
        {item.shippingGroup && (
          <Info wide label="발송 그룹" value={
            <Link href={`/shipping-groups/${item.shippingGroup.id}`} className="text-blue-600 underline dark:text-blue-400">
              {item.shippingGroup.label} →
            </Link>
          } />
        )}
        {item.purchaseLink && (
          <Info wide label="구매처" value={
            <a href={item.purchaseLink} target="_blank" rel="noopener noreferrer" className="break-all text-blue-600 underline dark:text-blue-400">
              {item.purchaseLink}
            </a>
          } />
        )}
        {item.memo && <Info wide label="메모" value={<span className="whitespace-pre-wrap">{item.memo}</span>} />}
      </dl>

      <section className="mt-8">
        <SectionHeader title="판매 관리" />
        <p className="mb-3 text-sm text-neutral-500">
          구매 수량 {item.quantity} · 잔여 수량{" "}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{remaining}</span>
          {sales.length > 0 && (
            <>
              {" "}· 손익 <span className={`font-medium ${profitColor(profit)}`}>{signedWon(profit)}</span>
            </>
          )}
        </p>

        {sales.length > 0 && (
          <ul className="mb-3 divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            {sales.map((sale) => (
              <li key={sale.id} className="flex items-center justify-between gap-2 py-1">
                <span>
                  {sale.saleDate ? sale.saleDate.toLocaleDateString("ko-KR") : "날짜 모름"} · {sale.quantitySold}개 ·{" "}
                  {won(Number(sale.saleAmount))}
                </span>
                <LocalForm action={deleteSale.bind(null, sale.id)}>
                  <ConfirmSubmitButton confirmMessage="이 판매 기록을 삭제할까요?" className={buttonClass("dangerGhost")}>
                    삭제
                  </ConfirmSubmitButton>
                </LocalForm>
              </li>
            ))}
          </ul>
        )}

        {remaining > 0 ? (
          // 판매 입력은 자주 쓰지 않으므로 접어두고, 판매 기록이 하나도 없을 때도 버튼 하나로만 보인다.
          <details className="rounded-lg border border-neutral-200 dark:border-neutral-800">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-medium">+ 판매 기록 추가</summary>
            <LocalForm action={createSale.bind(null, item.id)} className="flex flex-col gap-3 px-4 pb-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">판매 수량</span>
                <NumberInput name="quantitySold" min={1} max={remaining} defaultValue={1} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">판매 금액 (만원 단위, 전체 총액)</span>
                <ManwonInput name="saleAmount" step={0.01} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">판매일 (날짜 기반 통계에 사용 가능)</span>
                <ClearableDateInput name="saleDate" defaultValue={today} className={inputClass} />
              </label>
              <button type="submit" className={`mt-1 ${buttonClass()}`}>
                판매 등록
              </button>
            </LocalForm>
          </details>
        ) : (
          <p className="text-sm text-neutral-500">모두 판매되었습니다.</p>
        )}
      </section>

      <SameProductSection item={item} purchases={getSameProductItems(item.productGroupId)}
        candidates={getSameProductCandidates(item)} from={from} />

      {deleteForm}
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="break-words text-base">{value}</dd>
    </div>
  );
}

// 상세 상단의 상태 한 줄. 배송중일 때는 바로 수령 확인할 수 있게 버튼을 붙인다.
function ItemStatus({ item, remaining, showDeliveryAction }: {
  item: { id: string; isPhysical: boolean; expectedShipDate: Date | null; shipDateApprox: boolean };
  remaining: number; showDeliveryAction: boolean;
}) {
  const shipDate = item.expectedShipDate;
  if (remaining === 0) return <span className="font-medium text-neutral-500">판매 완료</span>;
  if (item.isPhysical) {
    return <span>{shipDate ? `배송 완료 (발송일 ${formatShipDateLabel(shipDate, item.shipDateApprox)})` : "현물 보유 중"}</span>;
  }
  if (!shipDate) return null;
  if (isShipmentOverdue(shipDate, item.shipDateApprox)) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-medium text-amber-600 dark:text-amber-400">배송중</span>
        <span className="text-neutral-500">(발송일 {formatShipDateLabel(shipDate, item.shipDateApprox)})</span>
        {showDeliveryAction && (
          <LocalForm action={confirmDelivery.bind(null, item.id)}>
            <button type="submit" className={buttonClass("secondary")}>수령 확인</button>
          </LocalForm>
        )}
      </div>
    );
  }
  return (
    <span>
      발송예정 {formatShipDateLabel(shipDate, item.shipDateApprox)}{" "}
      <span className="font-medium text-blue-600 dark:text-blue-400">{formatShipDDay(shipDate, item.shipDateApprox)}</span>
    </span>
  );
}
