import { notFound } from "next/navigation";
import { getItem, getFieldSuggestions } from "@/lib/items";
import { updateItem, deleteItem } from "@/lib/actions/items";
import { ItemForm, type ItemFormDefaults } from "@/components/item-form";
import { BackButton } from "@/components/back-button";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, suggestions] = await Promise.all([getItem(id), getFieldSuggestions()]);

  if (!item) notFound();

  const defaultValues: ItemFormDefaults = {
    genre: item.genre,
    character: item.character,
    series: item.series ?? "",
    itemType: item.itemType,
    detail: item.detail,
    quantity: item.quantity,
    price: (Number(item.price) / 10000).toString(),
    hasOverseasShipping: item.hasOverseasShipping,
    maker: item.maker ?? "",
    organizer: item.organizer ?? "",
    isPhysical: item.isPhysical,
    expectedShipDate: item.expectedShipDate
      ? item.expectedShipDate.toISOString().slice(0, 10)
      : "",
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <BackButton />
      <h1 className="mb-6 text-xl font-semibold">품목 수정</h1>
      <ItemForm
        action={updateItem.bind(null, item.id)}
        suggestions={suggestions}
        defaultValues={defaultValues}
      />

      <form action={deleteItem.bind(null, item.id)} className="mt-8 border-t pt-6 dark:border-neutral-800">
        <button type="submit" className="text-sm text-red-600 hover:underline">
          이 품목 삭제
        </button>
      </form>
    </div>
  );
}
