import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import { createItem } from "@/lib/actions/items";
import { NewItemDraftForm } from "@/components/new-item-draft-form";
import { BackButton } from "@/components/back-button";

import { db } from "@/lib/local/repository";
import { notFound } from "@/lib/local/navigation";
import { wonToManwon } from "@/lib/money";
import { itemHref } from "@/lib/nav";
import { PageHeader } from "@/components/ui";

export default function NewItemPage({ searchParams }: { searchParams: { sameAs?: string; entry?: string } }) {
  const sameAs = searchParams.sameAs ? db.item.findUnique({ where: { id: searchParams.sameAs } }) : null;
  if (searchParams.sameAs && !sameAs) notFound();
  const entry = !sameAs && searchParams.entry
    ? db.eventChecklistItem.findUnique({ where: { id: searchParams.entry } })
    : null;
  const event = entry ? db.event.findUnique({ where: { id: entry.eventId } }) : null;
  if (!sameAs && searchParams.entry && !entry) notFound();
  if (entry?.itemId) return <div className="p-6"><BackButton href={`/events/${entry.eventId}`} /><p>이미 품목으로 등록한 체크리스트 항목입니다.</p></div>;
  const [genreCatalog, itemTypeCatalog] = [getGenreCatalog(), getItemTypeCatalog()] as const;

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href={sameAs ? itemHref(sameAs.id, "/items") : entry ? `/events/${entry.eventId}` : "/items"} />
      <PageHeader title={sameAs ? "같은 물품 추가 구매" : "품목 등록"} />
      {sameAs && <p className="mb-4 text-sm text-muted">{sameAs.detail}의 물품 정보를 가져왔어요.</p>}
      {entry && <p className="mb-4 text-sm text-muted">{event?.name} · {entry.booth} 현장 구매</p>}
      <NewItemDraftForm sameAsItemId={sameAs?.id} checklistEntryId={entry?.id} defaultValues={sameAs ? { genre: sameAs.genre, character: sameAs.character, series: sameAs.series ?? "", itemType: sameAs.itemType, detail: sameAs.detail, imageUrl: sameAs.imageUrl }
        // 행사 현장 구매는 받아서 들고 온 물건이므로 현물로, 구매일은 행사 날짜로 채운다.
        : entry ? { detail: entry.label, price: wonToManwon(entry.price), quantity: entry.quantity, isPhysical: true, ...(event?.date ? { purchasedAt: event.date.toISOString().slice(0, 10) } : {}) } : undefined}
        action={createItem} genreCatalog={genreCatalog} itemTypeCatalog={itemTypeCatalog} />
    </div>
  );
}
