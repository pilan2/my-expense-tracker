import { getItemsByCategory } from "@/lib/items";
import { getCatalogOrderMaps, compareNameByCatalogOrder } from "@/lib/catalog";
import { BackButton } from "@/components/back-button";
import { ItemCardWithDelivery } from "@/components/item-card-with-delivery";
import { itemHref } from "@/lib/nav";
import { ProductGroupCard } from "@/components/product-group-card";
import { collapseProductGroups } from "@/lib/product-groups";

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

// 시리즈가 있는 품목만 시리즈별로 묶고(그 안에서 다시 물품 종류로), 없는 품목은 물품 종류로만 묶는다.
function groupBySeries<T extends { series: string | null; itemType: string }>(
  items: T[],
  itemTypeOrder: Map<string, number>,
) {
  const withoutSeries = items.filter((item) => !item.series);
  const seriesMap = new Map<string, T[]>();
  for (const item of items) {
    if (!item.series) continue;
    if (!seriesMap.has(item.series)) seriesMap.set(item.series, []);
    seriesMap.get(item.series)!.push(item);
  }
  const bySeries = [...seriesMap.entries()]
    .map(([series, seriesItems]) => ({ series, itemTypeGroups: groupByItemType(seriesItems, itemTypeOrder) }))
    .sort((a, b) => a.series.localeCompare(b.series, "ko"));

  return { withoutSeriesItemTypeGroups: groupByItemType(withoutSeries, itemTypeOrder), bySeries };
}

const cardClass = "block rounded-md border border-neutral-200 p-3 dark:border-neutral-800";

// 같은 물품으로 묶인 구매 건은 카드 하나로 접어서 보여준다.
function ItemList({ items, from }: { items: ReturnType<typeof getItemsByCategory>; from: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {collapseProductGroups(items).map((entry) => (
        <li key={entry.key}>
          {entry.items.length > 1 ? (
            <ProductGroupCard purchases={entry.items} from={from} className={cardClass} />
          ) : (
            <ItemCardWithDelivery {...entry.items[0]} href={itemHref(entry.items[0].id, from)}
              className={cardClass} showGenreCharacter={false} showItemType={false} />
          )}
        </li>
      ))}
    </ul>
  );
}

export default  function BrowseItemsPage({
  params,
}: {
  params: { genre: string; character: string };
}) {
  const { genre: genreParam, character: characterParam } = params;
  const genre = decodeURIComponent(genreParam);
  const character = decodeURIComponent(characterParam);

  const [items, orderMaps] = [getItemsByCategory(genre, character), getCatalogOrderMaps()] as const;
  const from = `/browse/${encodeURIComponent(genre)}/${encodeURIComponent(character)}`;
  // "기타"는 캐릭터 선택 단계를 건너뛰므로, 뒤로가기의 상위 화면도 장르 목록이 아니라 대시보드로.
  const parentHref = genre === character ? "/" : `/browse/${encodeURIComponent(genre)}`;

  const { withoutSeriesItemTypeGroups, bySeries } = groupBySeries(items, orderMaps.itemType);

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href={parentHref} />
      <h1 className="mb-6 text-xl font-semibold">{genre === character ? genre : `${genre} · ${character}`}</h1>

      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">해당하는 품목이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {withoutSeriesItemTypeGroups.map((itemTypeGroup) => (
            <div key={itemTypeGroup.itemType}>
              <h2 className="mb-2 text-base font-medium">{itemTypeGroup.itemType}</h2>
              <ItemList items={itemTypeGroup.items} from={from} />
            </div>
          ))}

          {bySeries.map((seriesGroup) => (
            <div key={seriesGroup.series}>
              <h2 className="mb-3 text-lg font-semibold">{seriesGroup.series}</h2>
              <div className="flex flex-col gap-4">
                {seriesGroup.itemTypeGroups.map((itemTypeGroup) => (
                  <div key={itemTypeGroup.itemType}>
                    <h3 className="mb-2 text-base font-medium">{itemTypeGroup.itemType}</h3>
                    <ItemList items={itemTypeGroup.items} from={from} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
