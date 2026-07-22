import "server-only";
import { prisma } from "@/lib/prisma";

export type GenreCatalogEntry = {
  id: string;
  name: string;
  order: number;
  characters: { id: string; name: string; order: number; series: { id: string; name: string }[] }[];
  makers: { id: string; name: string }[];
  organizers: { id: string; name: string }[];
};

export type ItemTypeCatalogEntry = { id: string; name: string; order: number };

// "기타"는 분류상 항상 맨 뒤로. 선택 버튼 목록 등에서 알파벳/가나다순으로 두면
// "기타"가 앞쪽에 오는 경우가 종종 있어서, 이 정렬을 항상 마지막에 다시 적용한다.
function compareWithEtcLast<T extends { name: string }>(a: T, b: T) {
  if (a.name === "기타") return 1;
  if (b.name === "기타") return -1;
  return a.name.localeCompare(b.name, "ko");
}

// 사용자가 /catalog에서 직접 지정한 순서(order)로 정렬하되, 값이 같으면 가나다순.
// "기타"도 다른 항목과 똑같이 이 순서를 따른다(사용자가 원하면 직접 맨 뒤로 옮길 수 있다).
function compareByOrder<T extends { name: string; order: number }>(a: T, b: T) {
  if (a.order !== b.order) return a.order - b.order;
  return a.name.localeCompare(b.name, "ko");
}

// 품목 등록 폼의 버튼 선택지 + /catalog 관리 화면에서 함께 쓰는 장르/캐릭터/시리즈/제작자/공구자 목록.
export async function getGenreCatalog(): Promise<GenreCatalogEntry[]> {
  const genres = await prisma.genre.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      characters: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          order: true,
          series: { orderBy: { name: "asc" }, select: { id: true, name: true } },
        },
      },
      makers: { orderBy: { name: "asc" }, select: { id: true, name: true } },
      organizers: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });

  return genres
    .map((genre) => ({
      ...genre,
      characters: genre.characters
        .map((character) => ({ ...character, series: [...character.series].sort(compareWithEtcLast) }))
        .sort(compareByOrder),
      makers: [...genre.makers].sort(compareWithEtcLast),
      organizers: [...genre.organizers].sort(compareWithEtcLast),
    }))
    .sort(compareByOrder);
}

// 장르/캐릭터와 무관한 전역 물품 종류(대분류) 목록.
export async function getItemTypeCatalog(): Promise<ItemTypeCatalogEntry[]> {
  const itemTypes = await prisma.itemType.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
  return [...itemTypes].sort(compareByOrder);
}

// 장르/캐릭터/물품종류의 이름 문자열만 들고 있는 화면(전체 품목 목록, 장르별로 보기, 통계 등)이
// 이 카탈로그 순서를 그대로 반영할 수 있도록, 이름 -> order 조회용 맵을 만들어 돌려준다.
// 캐릭터는 같은 이름이 여러 장르에 있을 수 있어 "장르::캐릭터"를 키로 쓴다.
export type CatalogOrderMaps = {
  genre: Map<string, number>;
  character: Map<string, number>;
  itemType: Map<string, number>;
};

export async function getCatalogOrderMaps(): Promise<CatalogOrderMaps> {
  const [genres, characters, itemTypes] = await Promise.all([
    prisma.genre.findMany({ select: { name: true, order: true } }),
    prisma.character.findMany({ select: { name: true, order: true, genre: { select: { name: true } } } }),
    prisma.itemType.findMany({ select: { name: true, order: true } }),
  ]);

  return {
    genre: new Map(genres.map((g) => [g.name, g.order])),
    character: new Map(characters.map((c) => [`${c.genre.name}::${c.name}`, c.order])),
    itemType: new Map(itemTypes.map((t) => [t.name, t.order])),
  };
}

// 이름 문자열 기준 비교(장르, 물품종류처럼 전역으로 하나의 order 맵을 쓰는 경우).
export function compareNameByCatalogOrder(orderMap: Map<string, number>, a: string, b: string) {
  const oa = orderMap.get(a) ?? 0;
  const ob = orderMap.get(b) ?? 0;
  if (oa !== ob) return oa - ob;
  return a.localeCompare(b, "ko");
}

// 캐릭터는 같은 장르 안에서만 order가 의미 있어서, 장르 이름을 함께 키로 넣어 비교한다.
export function compareCharacterByCatalogOrder(
  orderMap: Map<string, number>,
  genre: string,
  a: string,
  b: string,
) {
  const oa = orderMap.get(`${genre}::${a}`) ?? 0;
  const ob = orderMap.get(`${genre}::${b}`) ?? 0;
  if (oa !== ob) return oa - ob;
  return a.localeCompare(b, "ko");
}

// 품목 저장 시 새로 쓰인 값들을, 다음부터 버튼으로 고를 수 있도록 카탈로그에 채워 넣는다.
// 이미 있으면 조용히 무시(품목 저장 자체를 막으면 안 되므로 실패해도 무시).
export async function ensureInCatalog(data: {
  genre: string;
  character: string;
  series: string | null;
  itemType: string;
  maker: string | null;
  organizer: string | null;
}) {
  try {
    const genre = await prisma.genre.upsert({
      where: { name: data.genre },
      create: { name: data.genre },
      update: {},
    });
    const character = await prisma.character.upsert({
      where: { genreId_name: { genreId: genre.id, name: data.character } },
      create: { name: data.character, genreId: genre.id },
      update: {},
    });
    await prisma.itemType.upsert({
      where: { name: data.itemType },
      create: { name: data.itemType },
      update: {},
    });
    if (data.series) {
      await prisma.series.upsert({
        where: { characterId_name: { characterId: character.id, name: data.series } },
        create: { name: data.series, characterId: character.id },
        update: {},
      });
    }
    if (data.maker) {
      await prisma.maker.upsert({
        where: { genreId_name: { genreId: genre.id, name: data.maker } },
        create: { name: data.maker, genreId: genre.id },
        update: {},
      });
    }
    if (data.organizer) {
      await prisma.organizer.upsert({
        where: { genreId_name: { genreId: genre.id, name: data.organizer } },
        create: { name: data.organizer, genreId: genre.id },
        update: {},
      });
    }
  } catch {
    // 카탈로그 동기화 실패는 품목 저장 자체를 막을 이유가 없으니 무시.
  }
}
