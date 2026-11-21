import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import { createItem } from "@/lib/actions/items";
import { NewItemDraftForm } from "@/components/new-item-draft-form";
import { BackButton } from "@/components/back-button";

import { db } from "@/lib/local/repository";
import { notFound } from "@/lib/local/navigation";
import { wonToManwon } from "@/lib/money";
import { itemHref } from "@/lib/nav";
import { PageHeader } from "@/components/ui";

export default function NewItemPage({ searchParams }: { searchParams: { wish?: string; sameAs?: string; entry?: string } }) {
  const wish = searchParams.wish ? db.wish.findUnique({ where: { id: searchParams.wish } }) : null;
  if (searchParams.wish && !wish) notFound();
  const sameAs = !searchParams.wish && searchParams.sameAs ? db.item.findUnique({ where: { id: searchParams.sameAs } }) : null;
  if (!searchParams.wish && searchParams.sameAs && !sameAs) notFound();
  const entry = !wish && !sameAs && searchParams.entry
    ? db.eventChecklistItem.findUnique({ where: { id: searchParams.entry } })
    : null;
  const event = entry ? db.event.findUnique({ where: { id: entry.eventId } }) : null;
  if (!wish && !sameAs && searchParams.entry && !entry) notFound();
  if (entry?.itemId) return <div className="p-6"><BackButton href={`/events/${entry.eventId}`} /><p>이미 품목으로 등록한 체크리스트 항목입니다.</p></div>;
  if (wish?.status === "purchased") return <div className="p-6"><BackButton href="/budget" /><p>이미 품목으로 등록한 구매 후보입니다.</p></div>;
  const [genreCatalog, itemTypeCatalog] = [getGenreCatalog(), getItemTypeCatalog()] as const;

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href={sameAs ? itemHref(sameAs.id, "/items") : entry ? `/events/${entry.eventId}` : "/items"} />
      <PageHeader title={sameAs ? "같은 물품 추가 구매" : "품목 등록"} />
      {wish && <p className="mb-4 text-sm">구매 후보: {wish.title}. 실제 구매 금액과 구매일을 확인해주세요. 저장 후 구매 완료로 표시됩니다.</p>}
      {sameAs && <p className="mb-4 text-sm">{sameAs.detail}의 물품 정보를 가져왔습니다. 이번 구매의 가격·수량·구매처·배송 정보를 입력해주세요. 저장하면 기존 구매와 같은 물품으로 묶입니다.</p>}
      {entry && <p className="mb-4 text-sm">{event?.name} · {entry.booth}에서 구매한 &quot;{entry.label}&quot;을 품목으로 등록합니다. 저장하면 체크리스트 항목과 연결됩니다.</p>}
      <NewItemDraftForm wishId={wish?.id} sameAsItemId={sameAs?.id} checklistEntryId={entry?.id} defaultValues={wish ? { detail: wish.title, price: wonToManwon(wish.price), quantity: wish.quantity, shippingFee: wonToManwon(wish.shippingFee), purchaseLink: wish.purchaseLink ?? "", memo: wish.reason ?? "" }
        : sameAs ? { genre: sameAs.genre, character: sameAs.character, series: sameAs.series ?? "", itemType: sameAs.itemType, detail: sameAs.detail, imageUrl: sameAs.imageUrl }
        // 행사 현장 구매는 받아서 들고 온 물건이므로 현물로, 구매일은 행사 날짜로 채운다.
        : entry ? { detail: entry.label, price: wonToManwon(entry.price), quantity: entry.quantity, isPhysical: true, ...(event?.date ? { purchasedAt: event.date.toISOString().slice(0, 10) } : {}) } : undefined}
        action={createItem} genreCatalog={genreCatalog} itemTypeCatalog={itemTypeCatalog} />
    </div>
  );
}
