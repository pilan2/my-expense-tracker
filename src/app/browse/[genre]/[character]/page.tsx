import Link from "next/link";
import { getItemsByCategory } from "@/lib/items";
import { BackButton } from "@/components/back-button";
import { ItemCardContent } from "@/components/item-card";

export default async function BrowseItemsPage({
  params,
}: {
  params: Promise<{ genre: string; character: string }>;
}) {
  const { genre: genreParam, character: characterParam } = await params;
  const genre = decodeURIComponent(genreParam);
  const character = decodeURIComponent(characterParam);

  const items = await getItemsByCategory(genre, character);

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    if (!groups.has(item.itemType)) groups.set(item.itemType, []);
    groups.get(item.itemType)!.push(item);
  }
  // "기타"는 분류상 항상 맨 아래로.
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
    if (a === "기타") return 1;
    if (b === "기타") return -1;
    return a.localeCompare(b, "ko");
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <BackButton />
      <h1 className="mb-6 text-xl font-semibold">{genre === character ? genre : `${genre} · ${character}`}</h1>

      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">해당하는 품목이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedGroups.map(([itemType, groupItems]) => (
            <div key={itemType}>
              <h2 className="mb-2 text-sm font-medium text-neutral-500">{itemType}</h2>
              <ul className="flex flex-col gap-2">
                {groupItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/items/${item.id}`}
                      className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
                    >
                      <ItemCardContent {...item} showGenreCharacter={false} showItemType={false} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
