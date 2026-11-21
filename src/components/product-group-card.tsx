import { type ComponentProps } from "react";
import { LocalImage } from "@/components/local-image";
import { ItemCardWithDelivery } from "@/components/item-card-with-delivery";
import { purchaseSourceLabel, summarizeProductGroup } from "@/lib/product-groups";
import { itemHref } from "@/lib/nav";
import { won } from "@/lib/money";
import { formatDate } from "@/lib/dday";

type Purchase = Omit<ComponentProps<typeof ItemCardWithDelivery>, "href" | "price" | "shippingFee"> & {
  price: number; shippingFee: number; maker: string | null; organizer: string | null;
  purchaseLink: string | null; purchasedAt: Date | null;
};

// 같은 물품의 여러 구매 건을 카드 하나로 접고, 펼치면 구매 건별 카드(수령 확인 포함)를 보여준다.
export function ProductGroupCard({ purchases, from, className, showGenreCharacter, showItemType }: {
  purchases: Purchase[]; from: string; className?: string; showGenreCharacter?: boolean; showItemType?: boolean;
}) {
  const first = purchases[0];
  const summary = summarizeProductGroup(purchases);
  const imageUrl = purchases.find((purchase) => purchase.imageUrl)?.imageUrl;

  return (
    <details className={className}>
      <summary className="flex cursor-pointer items-start gap-3">
        {imageUrl && <LocalImage src={imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-medium">
            {showGenreCharacter ? `${first.genre === first.character ? first.genre : `${first.genre} · ${first.character}`} · ` : ""}
            {showItemType ? `${first.itemType} · ` : ""}
            {first.detail}
          </span>
          <span className="text-sm text-neutral-500">
            구매 {summary.count}건 · 총 수량 {summary.quantity}
            {summary.remainingQuantity !== summary.quantity ? ` (잔여 ${summary.remainingQuantity})` : ""}
          </span>
          <span className="text-sm text-neutral-500">
            {summary.minPrice === summary.maxPrice ? won(summary.minPrice) : `${won(summary.minPrice)}~${won(summary.maxPrice)}`}
            {" "}· 평균 {won(summary.averagePrice)}
          </span>
        </span>
      </summary>
      <ul className="mt-3 flex flex-col gap-2">
        {purchases.map(({ maker, organizer, purchaseLink, ...purchase }) => (
          <li key={purchase.id}>
            <ItemCardWithDelivery {...purchase} href={itemHref(purchase.id, from)}
              className="block rounded-2xl border border-line bg-surface shadow-card p-3"
              showGenreCharacter={false} showItemType={false}
              sourceLabel={`${purchaseSourceLabel({ maker, organizer, purchaseLink })} · ${purchase.purchasedAt ? formatDate(purchase.purchasedAt) : "구매일 모름"}`} />
          </li>
        ))}
      </ul>
    </details>
  );
}
