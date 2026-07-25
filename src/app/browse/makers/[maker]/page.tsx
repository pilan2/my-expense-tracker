import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemsByMaker } from "@/lib/items";
import { getCatalogOrderMaps, compareNameByCatalogOrder } from "@/lib/catalog";
import { BackButton } from "@/components/back-button";
import { ItemCardContent } from "@/components/item-card";
import { itemHref } from "@/lib/nav";

// 물품 종류(itemType)는 전역 카탈로그 순서를 그대로 쓴다.
function groupByItemType<T extends { itemType: string }>(items: T[], itemTypeOrder: Map<string, number>) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!map.has(item.itemType)) map.set(item.itemType, []);
    map.get(item.itemType)!.push(item);
  }
  return [...map.entries()]
    .map(([itemType, itemTypeItems]) => ({ itemType, items: itemTypeItems }))
    .sort((a, b) => compareNameByCatalogOrder(itemTypeOrder, a.itemType, b.itemType));
}

export default async function BrowseMakerItemsPage({
  params,
}: {
  params: Promise<{ maker: string }>;
}) {
  const { maker: makerParam } = await params;
  const maker = decodeURIComponent(makerParam);

  const [items, orderMaps] = await Promise.all([getItemsByMaker(maker), getCatalogOrderMaps()]);
  if (items.length === 0) notFound();

  // 한 제작자가 여러 장르에 걸쳐 활동할 수 있어서, 캐릭터는 장르별 순서 지정 없이 가나다순으로 묶는다.
  const characterMap = new Map<string, typeof items>();
  for (const item of items) {
    if (!characterMap.has(item.character)) characterMap.set(item.character, []);
    characterMap.get(item.character)!.push(item);
  }
  const groups = [...characterMap.entries()]
    .map(([character, characterItems]) => ({
      character,
      itemTypeGroups: groupByItemType(characterItems, orderMaps.itemType),
    }))
    .sort((a, b) => a.character.localeCompare(b.character, "ko"));

  const from = `/browse/makers/${encodeURIComponent(maker)}`;

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/browse/makers" />
      <h1 className="mb-6 text-xl font-semibold">{maker}</h1>

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.character}>
            <h2 className="mb-3 text-lg font-semibold">{group.character}</h2>
            <div className="flex flex-col gap-4">
              {group.itemTypeGroups.map((itemTypeGroup) => (
                <div key={itemTypeGroup.itemType}>
                  <h3 className="mb-2 text-base font-medium">{itemTypeGroup.itemType}</h3>
                  <ul className="flex flex-col gap-2">
                    {itemTypeGroup.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={itemHref(item.id, from)}
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
          </div>
        ))}
      </div>
    </div>
  );
}
