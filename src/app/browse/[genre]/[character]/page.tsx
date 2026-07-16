import Link from "next/link";
import { getItemsByCategory } from "@/lib/items";
import { BackButton } from "@/components/back-button";
import { ItemCardContent } from "@/components/item-card";
import { itemHref } from "@/lib/nav";

// "기타"는 분류상 항상 맨 아래로.
function compareWithEtcLast(a: string, b: string) {
  if (a === "기타") return 1;
  if (b === "기타") return -1;
  return a.localeCompare(b, "ko");
}

function groupByItemType<T extends { itemType: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!map.has(item.itemType)) map.set(item.itemType, []);
    map.get(item.itemType)!.push(item);
  }
  return [...map.entries()]
    .map(([itemType, itemTypeItems]) => ({ itemType, items: itemTypeItems }))
    .sort((a, b) => compareWithEtcLast(a.itemType, b.itemType));
}

// 시리즈가 있는 품목만 시리즈별로 묶고(그 안에서 다시 물품 종류로), 없는 품목은 물품 종류로만 묶는다.
function groupBySeries<T extends { series: string | null; itemType: string }>(items: T[]) {
  const withoutSeries = items.filter((item) => !item.series);
  const seriesMap = new Map<string, T[]>();
  for (const item of items) {
    if (!item.series) continue;
    if (!seriesMap.has(item.series)) seriesMap.set(item.series, []);
    seriesMap.get(item.series)!.push(item);
  }
  const bySeries = [...seriesMap.entries()]
    .map(([series, seriesItems]) => ({ series, itemTypeGroups: groupByItemType(seriesItems) }))
    .sort((a, b) => a.series.localeCompare(b.series, "ko"));

  return { withoutSeriesItemTypeGroups: groupByItemType(withoutSeries), bySeries };
}

export default async function BrowseItemsPage({
  params,
}: {
  params: Promise<{ genre: string; character: string }>;
}) {
  const { genre: genreParam, character: characterParam } = await params;
  const genre = decodeURIComponent(genreParam);
  const character = decodeURIComponent(characterParam);

  const items = await getItemsByCategory(genre, character);
  const from = `/browse/${encodeURIComponent(genre)}/${encodeURIComponent(character)}`;
  // "기타"는 캐릭터 선택 단계를 건너뛰므로, 뒤로가기의 상위 화면도 장르 목록이 아니라 대시보드로.
  const parentHref = genre === character ? "/" : `/browse/${encodeURIComponent(genre)}`;

  const { withoutSeriesItemTypeGroups, bySeries } = groupBySeries(items);

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
              <h2 className="mb-2 text-sm font-medium text-neutral-500">{itemTypeGroup.itemType}</h2>
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

          {bySeries.map((seriesGroup) => (
            <div key={seriesGroup.series}>
              <h2 className="mb-3 font-semibold">{seriesGroup.series}</h2>
              <div className="flex flex-col gap-4">
                {seriesGroup.itemTypeGroups.map((itemTypeGroup) => (
                  <div key={itemTypeGroup.itemType}>
                    <h3 className="mb-2 text-sm font-medium text-neutral-500">{itemTypeGroup.itemType}</h3>
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
      )}
    </div>
  );
}
