import { notFound } from "@/lib/local/navigation";
import { getItemsByMaker } from "@/lib/items";
import { getCatalogOrderMaps, compareNameByCatalogOrder } from "@/lib/catalog";
import { BackButton } from "@/components/back-button";
import { ItemCardWithDelivery } from "@/components/item-card-with-delivery";
import { itemHref } from "@/lib/nav";
import { PageHeader } from "@/components/ui";

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

export default  function BrowseMakerItemsPage({
  params,
}: {
  params: { maker: string };
}) {
  const { maker: makerParam } = params;
  const maker = decodeURIComponent(makerParam);

  const [items, orderMaps] = [getItemsByMaker(maker), getCatalogOrderMaps()] as const;
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
      <PageHeader title={maker} />

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
                        <ItemCardWithDelivery {...item} href={itemHref(item.id, from)}
                          className="block rounded-2xl border border-line bg-surface shadow-card p-3" showGenreCharacter={false} showItemType={false}  />
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
