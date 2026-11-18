import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import { createItem } from "@/lib/actions/items";
import { NewItemDraftForm } from "@/components/new-item-draft-form";
import { BackButton } from "@/components/back-button";

import { db } from "@/lib/local/repository";
import { notFound } from "@/lib/local/navigation";
import { wonToManwon } from "@/lib/money";
import { itemHref } from "@/lib/nav";

export default function NewItemPage({ searchParams }: { searchParams: { wish?: string; sameAs?: string } }) {
  const wish = searchParams.wish ? db.wish.findUnique({ where: { id: searchParams.wish } }) : null;
  if (searchParams.wish && !wish) notFound();
  const sameAs = !searchParams.wish && searchParams.sameAs ? db.item.findUnique({ where: { id: searchParams.sameAs } }) : null;
  if (!searchParams.wish && searchParams.sameAs && !sameAs) notFound();
  if (wish?.status === "purchased") return <div className="p-6"><BackButton href="/budget" /><p>이미 품목으로 등록한 구매 후보입니다.</p></div>;
  const [genreCatalog, itemTypeCatalog] = [getGenreCatalog(), getItemTypeCatalog()] as const;

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href={sameAs ? itemHref(sameAs.id, "/items") : "/items"} />
      <h1 className="mb-6 text-xl font-semibold">{sameAs ? "같은 물품 추가 구매" : "품목 등록"}</h1>
      {wish && <p className="mb-4 text-sm">구매 후보: {wish.title}. 실제 구매 금액과 구매일을 확인해주세요. 저장 후 구매 완료로 표시됩니다.</p>}
      {sameAs && <p className="mb-4 text-sm">{sameAs.detail}의 물품 정보를 가져왔습니다. 이번 구매의 가격·수량·구매처·배송 정보를 입력해주세요. 저장하면 기존 구매와 같은 물품으로 묶입니다.</p>}
      <NewItemDraftForm wishId={wish?.id} sameAsItemId={sameAs?.id} defaultValues={wish ? { detail: wish.title, price: wonToManwon(wish.price), quantity: wish.quantity, shippingFee: wonToManwon(wish.shippingFee), purchaseLink: wish.purchaseLink ?? "", memo: wish.reason ?? "" }
        : sameAs ? { genre: sameAs.genre, character: sameAs.character, series: sameAs.series ?? "", itemType: sameAs.itemType, detail: sameAs.detail, imageUrl: sameAs.imageUrl } : undefined}
        action={createItem} genreCatalog={genreCatalog} itemTypeCatalog={itemTypeCatalog} />
    </div>
  );
}
