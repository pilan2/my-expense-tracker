import { getFieldSuggestions } from "@/lib/items";
import { getGenreCatalog } from "@/lib/catalog";
import { createItem } from "@/lib/actions/items";
import { ItemForm } from "@/components/item-form";
import { BackButton } from "@/components/back-button";

export default async function NewItemPage() {
  const [suggestions, genreCatalog] = await Promise.all([getFieldSuggestions(), getGenreCatalog()]);

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href="/items" />
      <h1 className="mb-6 text-xl font-semibold">품목 등록</h1>
      <ItemForm action={createItem} suggestions={suggestions} genreCatalog={genreCatalog} />
    </div>
  );
}
