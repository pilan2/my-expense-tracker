import Link from "@/lib/local/navigation";
import { LocalForm } from "@/components/local-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { linkSameProduct, unlinkSameProduct } from "@/lib/actions/items";
import { purchaseSourceLabel, summarizeProductGroup } from "@/lib/product-groups";
import { isShipmentOverdue } from "@/lib/dday";
import type { Item } from "@/lib/local/models";
import { itemHref } from "@/lib/nav";
import { won } from "@/lib/money";
import { buttonClass, cardClass } from "@/components/ui";

type Purchase = Item & { remainingQuantity: number };

function statusLabel(item: Purchase) {
  if (item.remainingQuantity === 0) return "판매 완료";
  if (item.isPhysical) return "현물";
  if (item.expectedShipDate && isShipmentOverdue(item.expectedShipDate, item.shipDateApprox)) return "배송중";
  return "발송 대기";
}

export function SameProductSection({ item, purchases, candidates, from }: {
  item: Item; purchases: Purchase[]; candidates: Item[]; from: string;
}) {
  const summary = purchases.length > 1 ? summarizeProductGroup(purchases) : null;
  const linkClass = buttonClass("secondary");

  return (
    <div className={`mt-5 ${cardClass}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">같은 물품 구매 기록</h2>
        <Link href={`/items/new?sameAs=${encodeURIComponent(item.id)}`} className={linkClass}>
          + 같은 물품 추가 구매
        </Link>
      </div>

      {summary ? (
        <>
          <p className="mb-3 text-sm text-neutral-500">
            구매 {summary.count}건 · 총 수량 {summary.quantity}
            {summary.remainingQuantity !== summary.quantity ? ` (잔여 ${summary.remainingQuantity})` : ""} · 평균 단가{" "}
            {won(summary.averagePrice)}
            {summary.minPrice !== summary.maxPrice ? ` (${won(summary.minPrice)}~${won(summary.maxPrice)})` : ""}
          </p>
          <ul className="mb-3 flex flex-col gap-2 text-sm">
            {purchases.map((purchase) => {
              const content = (
                <>
                  <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="min-w-0 break-words font-medium">{purchaseSourceLabel(purchase)}</span>
                    <span className="shrink-0 whitespace-nowrap">{won(purchase.price)} × {purchase.quantity}</span>
                  </span>
                  <span className="text-neutral-500">
                    {purchase.purchasedAt ? purchase.purchasedAt.toLocaleDateString("ko-KR") : "구매일 모름"}
                    {purchase.shippingFee > 0 ? ` · 배송비 ${won(purchase.shippingFee)}` : ""} · {statusLabel(purchase)}
                    {purchase.remainingQuantity !== purchase.quantity ? ` · 잔여 ${purchase.remainingQuantity}` : ""}
                  </span>
                </>
              );
              const boxClass = "flex flex-col gap-0.5 rounded-xl border p-3";
              return (
                <li key={purchase.id}>
                  {purchase.id === item.id ? (
                    <div className={`${boxClass} border-accent/40 bg-accent-soft`}>
                      <span className="text-xs font-medium">현재 보고 있는 구매</span>
                      {content}
                    </div>
                  ) : (
                    <Link href={itemHref(purchase.id, from)}
                      className={`${boxClass} border-line bg-surface hover:bg-surface-soft`}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mb-3 text-sm text-neutral-500">판매는 실제로 판 구매 건의 화면에서 기록해야 손익이 정확합니다.</p>
          <LocalForm action={unlinkSameProduct.bind(null, item.id)}>
            <ConfirmSubmitButton confirmMessage="이 구매 건을 같은 물품 묶음에서 뺄까요? 품목과 판매 기록은 그대로 남습니다."
              className={buttonClass("ghost")}>
              이 구매 건을 묶음에서 빼기
            </ConfirmSubmitButton>
          </LocalForm>
        </>
      ) : (
        <p className="mb-3 text-sm text-neutral-500">
          다른 구매처나 다른 가격으로 같은 물품을 또 샀다면 추가 구매로 등록하세요. 구매 건마다 가격·배송·판매가 따로 기록되고 여기서 함께 비교할 수 있습니다.
        </p>
      )}

      {candidates.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer">이미 등록한 품목과 같은 물품으로 연결</summary>
          <p className="mt-2 text-neutral-500">같은 장르·캐릭터·물품 종류의 품목입니다. 상대 품목이 다른 묶음에 있으면 그 묶음 전체가 합쳐집니다.</p>
          <ul className="mt-2 flex flex-col gap-2">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface shadow-card p-3">
                <span className="min-w-0 break-words">
                  {candidate.series ? `(${candidate.series}) ` : ""}{candidate.detail}
                  <span className="block text-neutral-500">
                    {purchaseSourceLabel(candidate)} · {won(candidate.price)} × {candidate.quantity}
                    {candidate.purchasedAt ? ` · ${candidate.purchasedAt.toLocaleDateString("ko-KR")}` : ""}
                  </span>
                </span>
                <LocalForm action={linkSameProduct.bind(null, item.id, candidate.id)} className="shrink-0">
                  <button type="submit" className="min-h-11 whitespace-nowrap rounded-xl border border-accent/40 bg-surface px-3 py-2 font-semibold text-accent-ink">
                    연결
                  </button>
                </LocalForm>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
