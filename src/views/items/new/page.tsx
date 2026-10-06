import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import { createItem } from "@/lib/actions/items";
import { ItemForm } from "@/components/item-form";
import { BackButton } from "@/components/back-button";

import { db } from "@/lib/local/repository";
import { notFound } from "@/lib/local/navigation";
import { wonToManwon } from "@/lib/money";

export default function NewItemPage({ searchParams }: { searchParams: { wish?: string } }) {
  const wish = searchParams.wish ? db.wish.findUnique({ where: { id: searchParams.wish } }) : null;
  if (searchParams.wish && !wish) notFound();
  if (wish?.status === "purchased") return <div className="p-6"><BackButton href="/budget" /><p>이미 품목으로 등록한 구매 후보입니다.</p></div>;
  const [genreCatalog, itemTypeCatalog] = [getGenreCatalog(), getItemTypeCatalog()] as const;

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href="/items" />
      <h1 className="mb-6 text-xl font-semibold">품목 등록</h1>
      {wish && <p className="mb-4 text-sm">구매 후보: {wish.title}. 실제 구매 금액과 구매일을 확인해주세요. 저장 후 구매 완료로 표시됩니다.</p>}
      <ItemForm wishId={wish?.id} defaultValues={wish ? { detail: wish.title, price: wonToManwon(wish.price), quantity: wish.quantity, shippingFee: wonToManwon(wish.shippingFee), purchaseLink: wish.purchaseLink ?? "", memo: wish.reason ?? "" } : undefined} action={createItem} genreCatalog={genreCatalog} itemTypeCatalog={itemTypeCatalog} />
    </div>
  );
}
