import Link from "next/link";
import { getItems } from "@/lib/items";
import { getCatalogOrderMaps, compareNameByCatalogOrder, compareCharacterByCatalogOrder } from "@/lib/catalog";
import { assignShippingFee } from "@/lib/actions/shipping";
import { BackButton } from "@/components/back-button";
import { ItemsSelectableList } from "@/components/items-selectable-list";

// 캐릭터 안에서 시리즈가 있는 품목은 "캐릭터 (시리즈)"로, 없는 품목은 "캐릭터"만으로
// 한 줄 제목을 만든다. 같은 캐릭터라도 시리즈가 여러 개면 그만큼 제목이 나뉘어 반복된다.
// character/series를 따로 두는 건 렌더링에서 글자 크기를 다르게 주기 위해서다.
function groupByCharacterAndSeries<T extends { character: string; series: string | null }>(
  items: T[],
  genre: string,
  characterOrder: Map<string, number>,
) {
  const characterMap = new Map<string, T[]>();
  for (const item of items) {
    if (!characterMap.has(item.character)) characterMap.set(item.character, []);
    characterMap.get(item.character)!.push(item);
  }

  const groups: { character: string; series: string | null; items: T[] }[] = [];
  for (const [character, characterItems] of [...characterMap.entries()].sort((a, b) =>
    compareCharacterByCatalogOrder(characterOrder, genre, a[0], b[0]),
  )) {
    const withoutSeries = characterItems.filter((item) => !item.series);
    if (withoutSeries.length > 0) groups.push({ character, series: null, items: withoutSeries });

    const seriesMap = new Map<string, T[]>();
    for (const item of characterItems) {
      if (!item.series) continue;
      if (!seriesMap.has(item.series)) seriesMap.set(item.series, []);
      seriesMap.get(item.series)!.push(item);
    }
    for (const [series, seriesItems] of [...seriesMap.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko"))) {
      groups.push({ character, series, items: seriesItems });
    }
  }

  return groups;
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const { pending } = await searchParams;
  const pendingOnly = pending === "1";

  const [rawItems, orderMaps] = await Promise.all([
    getItems({ pendingShippingOnly: pendingOnly }),
    getCatalogOrderMaps(),
  ]);

  // Decimal은 클라이언트 컴포넌트(ItemsSelectableList)로 넘어갈 수 없는 객체라, 순수 값으로 바꿔둔다.
  const items = rawItems.map((item) => ({
    ...item,
    price: Number(item.price),
    shippingFee: Number(item.shippingFee),
    sales: item.sales.map((sale) => ({ ...sale, saleAmount: Number(sale.saleAmount) })),
  }));

  // 한 화면 안에서도 장르 > "캐릭터 (시리즈)"로 눈에 띄게 묶어서 보여주되(순서는 /catalog에서
  // 지정한 순서를 따르고), 체크박스는 전부 같은 폼 안에 있어야 배송비 나누기/묶음 판매가
  // 여러 그룹에 걸쳐 동작한다.
  const genreMap = new Map<string, typeof items>();
  for (const item of items) {
    if (!genreMap.has(item.genre)) genreMap.set(item.genre, []);
    genreMap.get(item.genre)!.push(item);
  }
  const groups = [...genreMap.entries()]
    .map(([genre, genreItems]) => ({
      genre,
      subgroups: groupByCharacterAndSeries(genreItems, genre, orderMaps.character),
    }))
    .sort((a, b) => compareNameByCatalogOrder(orderMaps.genre, a.genre, b.genre));

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href={pendingOnly ? "/items" : "/"} />
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{pendingOnly ? "배송비 미정 품목" : "전체 품목"}</h1>
        <Link
          href="/items/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          + 품목 등록
        </Link>
      </div>
      <div className="mb-6 flex gap-4 text-sm">
        <Link href={pendingOnly ? "/items" : "/items?pending=1"} className="underline">
          {pendingOnly ? "전체보기" : "배송비 미정만 보기"} →
        </Link>
        <Link href="/catalog" className="underline">
          장르/캐릭터 관리 →
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">
          {pendingOnly ? "배송비 미정인 품목이 없습니다." : "등록된 품목이 없습니다."}
        </p>
      ) : (
        <form action={assignShippingFee}>
          <ItemsSelectableList groups={groups} pendingOnly={pendingOnly} />
        </form>
      )}
    </div>
  );
}
