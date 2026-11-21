import Link from "@/lib/local/navigation";
import { getItemsByGenre } from "@/lib/items";
import { getCatalogOrderMaps, compareNameByCatalogOrder, compareCharacterByCatalogOrder } from "@/lib/catalog";
import { BackButton } from "@/components/back-button";
import { ItemCardWithDelivery } from "@/components/item-card-with-delivery";
import { ProductGroupCard } from "@/components/product-group-card";
import { collapseProductGroups } from "@/lib/product-groups";
import { itemHref } from "@/lib/nav";
import { EmptyState, PageHeader } from "@/components/ui";

type GenreItem = ReturnType<typeof getItemsByGenre>[number];

function groupByItemType(items: GenreItem[], itemTypeOrder: Map<string, number>) {
  const map = new Map<string, GenreItem[]>();
  for (const item of items) {
    if (!map.has(item.itemType)) map.set(item.itemType, []);
    map.get(item.itemType)!.push(item);
  }
  return [...map.entries()]
    .map(([itemType, itemTypeItems]) => ({ itemType, items: itemTypeItems }))
    .sort((a, b) => compareNameByCatalogOrder(itemTypeOrder, a.itemType, b.itemType));
}

const cardClass = "block rounded-2xl border border-line bg-surface shadow-card p-3";

// 같은 물품으로 묶인 구매 건은 카드 하나로 접어서 보여준다.
function ItemList({ items, from }: { items: GenreItem[]; from: string }) {
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

// 한 캐릭터 안에서는 시리즈 없는 품목을 먼저 물품 종류별로, 시리즈가 있으면 시리즈 > 물품 종류로 묶는다.
function CharacterItems({ items, from, itemTypeOrder }: { items: GenreItem[]; from: string; itemTypeOrder: Map<string, number> }) {
  const withoutSeries = groupByItemType(items.filter((item) => !item.series), itemTypeOrder);
  const seriesNames = [...new Set(items.flatMap((item) => (item.series ? [item.series] : [])))].sort((a, b) => a.localeCompare(b, "ko"));
  return (
    <div className="flex flex-col gap-4">
      {withoutSeries.map((group) => (
        <div key={group.itemType}>
          <h3 className="mb-2 text-sm font-semibold text-muted">{group.itemType}</h3>
          <ItemList items={group.items} from={from} />
        </div>
      ))}
      {seriesNames.map((series) => (
        <div key={series}>
          <h3 className="mb-2 text-base font-bold">{series}</h3>
          <div className="flex flex-col gap-3">
            {groupByItemType(items.filter((item) => item.series === series), itemTypeOrder).map((group) => (
              <div key={group.itemType}>
                <h4 className="mb-2 text-sm font-semibold text-muted">{group.itemType}</h4>
                <ItemList items={group.items} from={from} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BrowseGenrePage({
  params,
  searchParams,
}: {
  params: { genre: string };
  searchParams: { character?: string };
}) {
  const genre = decodeURIComponent(params.genre);
  const [items, orderMaps] = [getItemsByGenre(genre), getCatalogOrderMaps()] as const;
  const characters = [...new Set(items.map((item) => item.character))]
    .sort((a, b) => compareCharacterByCatalogOrder(orderMaps.character, genre, a, b));
  const selected = searchParams.character && characters.includes(searchParams.character) ? searchParams.character : null;
  const genreHref = `/browse/${encodeURIComponent(genre)}`;
  const characterHref = (character: string) => `${genreHref}?character=${encodeURIComponent(character)}`;
  const from = selected ? characterHref(selected) : genreHref;
  const shownCharacters = selected ? [selected] : characters;
  const chipClass = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm ${active ? "border-accent bg-accent font-semibold text-on-accent" : "border-line bg-surface"}`;

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-5 sm:p-6">
      <BackButton href="/" />
      <PageHeader title={genre} />

      {/* 캐릭터는 들어가서 고르는 단계가 아니라, 전체 목록을 좁히는 필터로 쓴다. */}
      {characters.length > 1 && (
        <nav aria-label="캐릭터 필터" className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
          <Link href={genreHref} aria-current={selected ? undefined : "page"} className={chipClass(!selected)}>
            전체 <span className="ml-1 opacity-70">{items.length}</span>
          </Link>
          {characters.map((character) => (
            <Link key={character} href={characterHref(character)} aria-current={selected === character ? "page" : undefined} className={chipClass(selected === character)}>
              {character} <span className="ml-1 opacity-70">{items.filter((item) => item.character === character).length}</span>
            </Link>
          ))}
        </nav>
      )}

      {items.length === 0 ? (
        <EmptyState>보유 중인 품목이 없습니다.</EmptyState>
      ) : (
        <div className="flex flex-col gap-8">
          {shownCharacters.map((character) => (
            <section key={character} aria-label={character}>
              {/* 캐릭터가 하나뿐이거나 이미 골랐으면 제목이 필터와 겹치므로 생략한다. */}
              {characters.length > 1 && !selected && <h2 className="mb-3 text-xl font-bold">{character}</h2>}
              <CharacterItems items={items.filter((item) => item.character === character)} from={from} itemTypeOrder={orderMaps.itemType} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
