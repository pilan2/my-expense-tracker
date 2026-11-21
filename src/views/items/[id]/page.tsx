
import { LocalImage } from "@/components/local-image";
import { LocalForm } from "@/components/local-form";
import Link from "@/lib/local/navigation";
import { notFound } from "@/lib/local/navigation";
import { getItem, getSameProductItems, getSameProductCandidates } from "@/lib/items";
import { SameProductSection } from "@/components/same-product-section";
import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import { getSalesForItem, calcRemainingQuantity, calcProfit } from "@/lib/sales";
import { updateItem, deleteItem, confirmDelivery } from "@/lib/actions/items";
import { createSale } from "@/lib/actions/sales";
import { SaleRow } from "@/components/sale-row";
import { ItemForm, type ItemFormDefaults } from "@/components/item-form";
import { BackButton } from "@/components/back-button";
import { NumberInput } from "@/components/number-input";
import { ClearableDateInput } from "@/components/clearable-date-input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { wonToManwon, won, signedWon } from "@/lib/money";
import { formatShipDDay, formatShipDateLabel, isShipmentOverdue, formatDate } from "@/lib/dday";
import { safeRedirectTarget } from "@/lib/nav";
import { todayString } from "@/lib/budget";
import { profitColor, buttonClass, inputClass, linkClass, warningColor, cardClass, chipClass } from "@/components/ui";
import { ItemThumb } from "@/components/item-card";
import { ShippingGroupPicker } from "@/components/shipping-group-picker";
import { getShippingGroups } from "@/lib/shipping-groups";
import { itemStatusChip } from "@/lib/item-status";
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

  // 날짜는 UTC 자정으로 저장하지만 "오늘"은 기기 현지 날짜여야 새벽에 어제로 잡히지 않는다.
  const today = todayString();
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
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm"><ItemStatus item={item} remaining={remaining} /></div>
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

  const delivering = !item.isPhysical && remaining > 0 && item.expectedShipDate !== null && isShipmentOverdue(item.expectedShipDate, item.shipDateApprox);

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-5 sm:p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <BackButton href={from} />
        <Link href={selfHref(item.id, from, "edit")} className={`mb-2 ${buttonClass("secondary")}`}>
          수정
        </Link>
      </div>

      {item.imageUrl ? (
        <LocalImage src={item.imageUrl} alt="" className="mb-5 max-h-96 w-full rounded-3xl bg-surface-soft object-contain" />
      ) : (
        <ItemThumb name={item.detail} seed={item.detail} className="mb-5 aspect-[5/3] w-full rounded-3xl text-6xl" />
      )}
      <p className="flex flex-wrap gap-x-1 text-sm text-muted">
        <span>{item.genre === item.character ? item.genre : `${item.genre} · ${item.character}`}</span>
        {item.series && <span>({item.series})</span>}
        <span>· {item.itemType}</span>
      </p>
      <h1 className="mt-0.5 break-words text-2xl font-bold leading-snug">{item.detail}</h1>
      <div className="mt-3 mb-5 flex flex-wrap items-center gap-2 text-sm"><ItemStatus item={item} remaining={remaining} /></div>

      {delivering && (
        // 배송중인 품목에서 가장 자주 하는 일이라 화면에서 가장 눈에 띄는 버튼으로 둔다.
        <LocalForm action={confirmDelivery.bind(null, item.id)} className="mb-5">
          <button type="submit" className={`w-full ${buttonClass()} min-h-12 text-base`}>받았어요 · 수령 확인</button>
        </LocalForm>
      )}

      <dl className={`grid grid-cols-2 gap-x-4 gap-y-4 ${cardClass}`}>
        <Info label="단가" value={<span className="font-semibold">{won(Number(item.price))}</span>} />
        <Info label="수량" value={remaining !== item.quantity ? `${item.quantity}개 (잔여 ${remaining})` : `${item.quantity}개`} />
        <Info label="구매일" value={item.purchasedAt ? formatDate(item.purchasedAt) : "모름"} />
        <Info label="배송비" value={item.hasOverseasShipping ? <span className={warningColor}>이후 계산 필요</span> : won(Number(item.shippingFee))} />
        {item.maker && <Info label="제작한 사람" value={item.maker} />}
        {item.organizer && <Info label="공구 개최한 사람" value={item.organizer} />}
        {(item.shippingGroup || !item.isPhysical) && (
          <Info wide label="발송 그룹" value={
            <ShippingGroupPicker itemId={item.id} current={item.shippingGroup}
              groups={getShippingGroups().map((group) => ({ id: group.id, label: group.label, count: group.items.length }))} />
          } />
        )}
        {item.purchaseLink && (
          <Info wide label="구매처" value={
            <a href={item.purchaseLink} target="_blank" rel="noopener noreferrer" className="break-all text-accent-ink underline">
              {item.purchaseLink}
            </a>
          } />
        )}
        {item.memo && <Info wide label="메모" value={<span className="whitespace-pre-wrap">{item.memo}</span>} />}
        <div className="col-span-2 flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <dt className="text-sm text-muted">총 구매 금액</dt>
          <dd className="text-xl font-bold">{won(total)}</dd>
        </div>
      </dl>

      <section className={`mt-5 ${cardClass}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">판매 관리</h2>
          <span className="text-sm text-muted">잔여 {remaining}개</span>
        </div>
        {sales.length > 0 && (
          <p className="mb-3 text-sm text-muted">
            판매 손익 <span className={`font-semibold ${profitColor(profit)}`}>{signedWon(profit)}</span>
          </p>
        )}

        {sales.length > 0 && (
          <ul className="mb-3 divide-y divide-line text-sm">
            {sales.map((sale) => (
              <SaleRow key={sale.id} sale={{ ...sale, saleAmount: Number(sale.saleAmount) }} maxQuantity={remaining + sale.quantitySold} />
            ))}
          </ul>
        )}

        {remaining > 0 ? (
          // 판매 입력은 자주 쓰지 않으므로 접어두고, 판매 기록이 하나도 없을 때도 버튼 하나로만 보인다.
          <details className="rounded-xl border border-dashed border-accent/40 bg-background">
            <summary className="flex min-h-11 cursor-pointer items-center justify-center px-4 text-sm font-semibold text-accent-ink">+ 판매 기록 추가</summary>
            <LocalForm action={createSale.bind(null, item.id)} className="flex flex-col gap-3 px-4 pb-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">판매 수량</span>
                <NumberInput name="quantitySold" min={1} max={remaining} defaultValue={1} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">판매 금액 (만원, 총액)</span>
                <ManwonInput name="saleAmount" required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">판매일</span>
                <ClearableDateInput name="saleDate" defaultValue={today} className={inputClass} />
              </label>
              <button type="submit" className={`mt-1 ${buttonClass()}`}>
                판매 등록
              </button>
            </LocalForm>
          </details>
        ) : (
          <p className="text-sm text-muted">모두 판매되었습니다.</p>
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

// 상세 상단의 상태: 색 칩과 함께 날짜를 작게 붙인다.
function ItemStatus({ item, remaining }: {
  item: { isPhysical: boolean; expectedShipDate: Date | null; shipDateApprox: boolean; hasOverseasShipping: boolean };
  remaining: number;
}) {
  const shipDate = item.expectedShipDate;
  const status = itemStatusChip({ ...item, remainingQuantity: remaining });
  const dateText = !shipDate ? null
    : item.isPhysical ? `배송 완료 (발송일 ${formatShipDateLabel(shipDate, item.shipDateApprox)})`
    : isShipmentOverdue(shipDate, item.shipDateApprox) ? `발송일 ${formatShipDateLabel(shipDate, item.shipDateApprox)}`
    : `발송예정 ${formatShipDateLabel(shipDate, item.shipDateApprox)} · ${formatShipDDay(shipDate, item.shipDateApprox)}`;
  return (
    <>
      {status && <span className={chipClass(status.kind)}>{status.kind === "have" && !shipDate ? "현물 보유 중" : status.label}</span>}
      {dateText && remaining > 0 && <span className="text-muted">{dateText}</span>}
      {item.hasOverseasShipping && <span className={chipClass("fee")}>배송비 미정</span>}
    </>
  );
}
