import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import { createItem } from "@/lib/actions/items";
import { ItemForm } from "@/components/item-form";
import { BackButton } from "@/components/back-button";

export default  function NewItemPage() {
  const [genreCatalog, itemTypeCatalog] = [getGenreCatalog(), getItemTypeCatalog()] as const;

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href="/items" />
      <h1 className="mb-6 text-xl font-semibold">품목 등록</h1>
      <ItemForm action={createItem} genreCatalog={genreCatalog} itemTypeCatalog={itemTypeCatalog} />
    </div>
  );
}
