import "server-only";
import { prisma } from "@/lib/prisma";

export type GenreCatalogEntry = {
  id: string;
  name: string;
  characters: { id: string; name: string; series: { id: string; name: string }[] }[];
  makers: { id: string; name: string }[];
  organizers: { id: string; name: string }[];
};

export type ItemTypeCatalogEntry = { id: string; name: string };

// 품목 등록 폼의 버튼 선택지 + /catalog 관리 화면에서 함께 쓰는 장르/캐릭터/시리즈/제작자/공구자 목록.
export async function getGenreCatalog(): Promise<GenreCatalogEntry[]> {
  return prisma.genre.findMany({
    orderBy: { name: "asc" },
    include: {
      characters: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, series: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
      },
      makers: { orderBy: { name: "asc" }, select: { id: true, name: true } },
      organizers: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
}

// 장르/캐릭터와 무관한 전역 물품 종류(대분류) 목록.
export function getItemTypeCatalog(): Promise<ItemTypeCatalogEntry[]> {
  return prisma.itemType.findMany({ orderBy: { name: "asc" } });
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
