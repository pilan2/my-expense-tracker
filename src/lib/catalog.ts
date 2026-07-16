import "server-only";
import { prisma } from "@/lib/prisma";

export type GenreCatalogEntry = {
  id: string;
  name: string;
  characters: { id: string; name: string }[];
};

// 품목 등록 폼의 버튼 선택지 + /catalog 관리 화면에서 함께 쓰는 장르/캐릭터 목록.
export async function getGenreCatalog(): Promise<GenreCatalogEntry[]> {
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
    include: { characters: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
  });
  return genres;
}

// Item.genre/character에 새 값이 쓰이면, 다음부터 버튼으로 고를 수 있도록 카탈로그에 채워 넣는다.
// 이미 있으면 조용히 무시(품목 저장 자체를 막으면 안 되므로 실패해도 무시).
export async function ensureInCatalog(genreName: string, characterName: string) {
  try {
    const genre = await prisma.genre.upsert({
      where: { name: genreName },
      create: { name: genreName },
      update: {},
    });
    await prisma.character.upsert({
      where: { genreId_name: { genreId: genre.id, name: characterName } },
      create: { name: characterName, genreId: genre.id },
      update: {},
    });
  } catch {
    // 카탈로그 동기화 실패는 품목 저장 자체를 막을 이유가 없으니 무시.
  }
}
