import { localAction } from "@/lib/local/action";

import { transactionDb as db } from "@/lib/local/repository";
import { ConflictError } from "@/lib/local/models";

// 이름 수정 폼(useActionState)이 화면에 보여줄 결과. throw 대신 값으로 돌려줘야
// 프로덕션 빌드에서도 실제 에러 메시지가 사용자에게 보인다(throw는 프로덕션에서 감춰짐).
export type RenameState = { error?: string };

// DB의 unique 제약(같은 장르 내 캐릭터명, 같은 캐릭터 내 시리즈명 등)에 걸리면
// 원인을 알 수 없는 에러 대신 이름 충돌이라는 걸 바로 알려준다.
async function renameCatchingConflict(run: () => unknown, conflictMessage: string): Promise<RenameState> {
  try {
    await run();
    return {};
  } catch (error) {
    if (error instanceof ConflictError) {
      return { error: conflictMessage };
    }
    throw error;
  }
}

// 드래그로 정해진 최종 순서(id 배열)를 그대로 0부터 순번을 매겨 저장한다.
async function persistOrder(
  orderedIds: string[],
  persist: (id: string, order: number) => unknown,
) {
  await db.batch(orderedIds.map((id, order) => persist(id, order)));
}

export const reorderGenres = localAction(async function reorderGenres(orderedIds: string[]) {
  await persistOrder(orderedIds, (id, order) => db.genre.update({ where: { id }, data: { order } }));
});

// 캐릭터는 같은 장르 안에서만 순서가 의미 있으므로, 넘어온 id들이 실제로 그 장르 소속인지는
// 신경 쓰지 않고(항상 같은 장르 카드 안에서만 드래그가 일어남) 그대로 저장한다.
export const reorderCharacters = localAction(async function reorderCharacters(orderedIds: string[]) {
  await persistOrder(orderedIds, (id, order) => db.character.update({ where: { id }, data: { order } }));
});

export const reorderItemTypes = localAction(async function reorderItemTypes(orderedIds: string[]) {
  await persistOrder(orderedIds, (id, order) => db.itemType.update({ where: { id }, data: { order } }));
});

export const addGenre = localAction(async function addGenre(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.genre.upsert({ where: { name }, create: { name }, update: {} });
});

export const deleteGenre = localAction(async function deleteGenre(id: string) {
  await db.genre.delete({ where: { id } });
});

// 장르 이름을 바꾸면, 그 이름을 쓰던 품목들의 genre 값도 함께 바꾼다.
export const renameGenre = localAction(async function renameGenre(id: string, prevState: RenameState, formData: FormData): Promise<RenameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};

  const genre = await db.genre.findUniqueOrThrow({ where: { id } });
  if (name === genre.name) return {};

  const result = await renameCatchingConflict(
    () =>
      db.batch([
        db.genre.update({ where: { id }, data: { name } }),
        db.item.updateMany({ where: { genre: genre.name }, data: { genre: name } }),
      ]),
    `이미 "${name}" 이름의 장르가 있습니다.`,
  );
  return result;
});

export const addCharacter = localAction(async function addCharacter(genreId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.character.upsert({
    where: { genreId_name: { genreId, name } },
    create: { name, genreId },
    update: {},
  });
});

export const deleteCharacter = localAction(async function deleteCharacter(id: string) {
  await db.character.delete({ where: { id } });
});

// 캐릭터 이름을 바꾸면, 같은 장르에서 그 이름을 쓰던 품목들의 character 값도 함께 바꾼다.
export const renameCharacter = localAction(async function renameCharacter(
  id: string,
  prevState: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};

  const character = await db.character.findUniqueOrThrow({ where: { id }, include: { genre: true } });
  if (name === character.name) return {};

  const result = await renameCatchingConflict(
    () =>
      db.batch([
        db.character.update({ where: { id }, data: { name } }),
        db.item.updateMany({
          where: { genre: character.genre.name, character: character.name },
          data: { character: name },
        }),
      ]),
    `이미 "${character.genre.name}" 장르에 "${name}" 이름의 캐릭터가 있습니다.`,
  );
  return result;
});

export const addSeries = localAction(async function addSeries(characterId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.series.upsert({
    where: { characterId_name: { characterId, name } },
    create: { name, characterId },
    update: {},
  });
});

export const deleteSeries = localAction(async function deleteSeries(id: string) {
  await db.series.delete({ where: { id } });
});

// 시리즈 이름을 바꾸면, 같은 장르/캐릭터에서 그 이름을 쓰던 품목들의 series 값도 함께 바꾼다.
export const renameSeries = localAction(async function renameSeries(id: string, prevState: RenameState, formData: FormData): Promise<RenameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};

  const series = await db.series.findUniqueOrThrow({
    where: { id },
    include: { character: { include: { genre: true } } },
  });
  if (name === series.name) return {};

  const result = await renameCatchingConflict(
    () =>
      db.batch([
        db.series.update({ where: { id }, data: { name } }),
        db.item.updateMany({
          where: {
            genre: series.character.genre.name,
            character: series.character.name,
            series: series.name,
          },
          data: { series: name },
        }),
      ]),
    `이미 "${series.character.name}" 캐릭터에 "${name}" 이름의 시리즈가 있습니다.`,
  );
  return result;
});

export const addItemType = localAction(async function addItemType(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.itemType.upsert({ where: { name }, create: { name }, update: {} });
});

export const deleteItemType = localAction(async function deleteItemType(id: string) {
  await db.itemType.delete({ where: { id } });
});

// 물품 종류 이름을 바꾸면(전역), 그 이름을 쓰던 모든 품목의 itemType 값도 함께 바꾼다.
export const renameItemType = localAction(async function renameItemType(
  id: string,
  prevState: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};

  const itemType = await db.itemType.findUniqueOrThrow({ where: { id } });
  if (name === itemType.name) return {};

  const result = await renameCatchingConflict(
    () =>
      db.batch([
        db.itemType.update({ where: { id }, data: { name } }),
        db.item.updateMany({ where: { itemType: itemType.name }, data: { itemType: name } }),
      ]),
    `이미 "${name}" 이름의 물품 종류가 있습니다.`,
  );
  return result;
});

export const addMaker = localAction(async function addMaker(genreId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.maker.upsert({
    where: { genreId_name: { genreId, name } },
    create: { name, genreId },
    update: {},
  });
});

export const deleteMaker = localAction(async function deleteMaker(id: string) {
  await db.maker.delete({ where: { id } });
});

// 제작자 이름을 바꾸면, 같은 장르에서 그 이름을 쓰던 품목들의 maker 값도 함께 바꾼다.
export const renameMaker = localAction(async function renameMaker(id: string, prevState: RenameState, formData: FormData): Promise<RenameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};

  const maker = await db.maker.findUniqueOrThrow({ where: { id }, include: { genre: true } });
  if (name === maker.name) return {};

  const result = await renameCatchingConflict(
    () =>
      db.batch([
        db.maker.update({ where: { id }, data: { name } }),
        db.item.updateMany({ where: { genre: maker.genre.name, maker: maker.name }, data: { maker: name } }),
      ]),
    `이미 "${maker.genre.name}" 장르에 "${name}" 이름의 제작자가 있습니다.`,
  );
  return result;
});

export const addOrganizer = localAction(async function addOrganizer(genreId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.organizer.upsert({
    where: { genreId_name: { genreId, name } },
    create: { name, genreId },
    update: {},
  });
});

export const deleteOrganizer = localAction(async function deleteOrganizer(id: string) {
  await db.organizer.delete({ where: { id } });
});

// 공구자 이름을 바꾸면, 같은 장르에서 그 이름을 쓰던 품목들의 organizer 값도 함께 바꾼다.
export const renameOrganizer = localAction(async function renameOrganizer(
  id: string,
  prevState: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};

  const organizer = await db.organizer.findUniqueOrThrow({ where: { id }, include: { genre: true } });
  if (name === organizer.name) return {};

  const result = await renameCatchingConflict(
    () =>
      db.batch([
        db.organizer.update({ where: { id }, data: { name } }),
        db.item.updateMany({
          where: { genre: organizer.genre.name, organizer: organizer.name },
          data: { organizer: name },
        }),
      ]),
    `이미 "${organizer.genre.name}" 장르에 "${name}" 이름의 공구자가 있습니다.`,
  );
  return result;
});
