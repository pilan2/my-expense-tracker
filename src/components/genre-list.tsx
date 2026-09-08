"use client";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EditableName } from "@/components/editable-name";
import { DragHandle, SortableList } from "@/components/sortable-list";
import type { GenreCatalogEntry } from "@/lib/catalog";

type CatalogActions = Pick<
  typeof import("@/lib/actions/catalog"),
  | "deleteGenre"
  | "renameGenre"
  | "reorderGenres"
  | "addCharacter"
  | "deleteCharacter"
  | "renameCharacter"
  | "reorderCharacters"
  | "addSeries"
  | "deleteSeries"
  | "renameSeries"
  | "addMaker"
  | "deleteMaker"
  | "renameMaker"
  | "addOrganizer"
  | "deleteOrganizer"
  | "renameOrganizer"
>;

// /catalog의 장르 카드 목록. 장르 순서와, 각 장르 안 캐릭터 순서를 드래그로 바꿀 수 있다.
// 두 단계 모두 각자 독립된 드래그 영역이라(장르끼리만, 같은 장르의 캐릭터끼리만 섞임),
// 중첩된 SortableList 두 개로 구성한다.
export function GenreList({ genres, actions }: { genres: GenreCatalogEntry[]; actions: CatalogActions }) {
  if (genres.length === 0) {
    return <p className="py-10 text-center text-neutral-500">등록된 장르가 없습니다.</p>;
  }

  return (
    <SortableList
      items={genres}
      onReorder={actions.reorderGenres}
      dndId="genres"
      className="flex flex-col gap-6"
      renderItem={(genre, handle) => (
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DragHandle {...handle} />
              <h2 className="font-semibold">
                <EditableName name={genre.name} action={actions.renameGenre.bind(null, genre.id)} />
              </h2>
            </div>
            <form action={actions.deleteGenre.bind(null, genre.id)}>
              <ConfirmSubmitButton
                confirmMessage={`"${genre.name}" 장르를 삭제하시겠습니까? 이 장르에 속한 캐릭터/시리즈/제작자/공구자 목록도 함께 삭제됩니다.`}
                className="text-sm text-red-600 hover:underline"
              >
                장르 삭제
              </ConfirmSubmitButton>
            </form>
          </div>

          <details>
            <summary className="mb-4 cursor-pointer text-sm underline">자세히 보기</summary>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-neutral-500">캐릭터</h3>
              {genre.characters.length === 0 ? (
                <p className="text-sm text-neutral-500">캐릭터가 없습니다.</p>
              ) : (
                <SortableList
                  items={genre.characters}
                  onReorder={actions.reorderCharacters}
                  dndId={`characters-${genre.id}`}
                  className="flex flex-col gap-3"
                  renderItem={(character, charHandle) => (
                    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DragHandle {...charHandle} />
                          <span className="text-sm font-medium">
                            <EditableName name={character.name} action={actions.renameCharacter.bind(null, character.id)} />
                          </span>
                        </div>
                        <form action={actions.deleteCharacter.bind(null, character.id)}>
                          <ConfirmSubmitButton
                            confirmMessage={`"${character.name}" 캐릭터를 삭제하시겠습니까? 이 캐릭터의 시리즈 목록도 함께 삭제됩니다.`}
                            className="text-xs text-red-600 hover:underline"
                          >
                            캐릭터 삭제
                          </ConfirmSubmitButton>
                        </form>
                      </div>

                      <ul className="mb-2 flex flex-wrap gap-1.5">
                        {character.series.map((series) => (
                          <li
                            key={series.id}
                            className="flex items-center gap-1 rounded-full border border-neutral-200 py-0.5 pr-1 pl-2 text-xs dark:border-neutral-800"
                          >
                            <EditableName name={series.name} action={actions.renameSeries.bind(null, series.id)} />
                            <form action={actions.deleteSeries.bind(null, series.id)}>
                              <ConfirmSubmitButton
                                confirmMessage={`"${series.name}" 시리즈를 삭제하시겠습니까?`}
                                className="flex h-4 w-4 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              >
                                ×
                              </ConfirmSubmitButton>
                            </form>
                          </li>
                        ))}
                        {character.series.length === 0 && (
                          <li className="text-xs text-neutral-500">시리즈가 없습니다.</li>
                        )}
                      </ul>

                      <form action={actions.addSeries.bind(null, character.id)} className="flex gap-2">
                        <input
                          name="name"
                          placeholder="새 시리즈 이름"
                          required
                          className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:opacity-70 dark:border-neutral-700"
                        >
                          시리즈 추가
                        </button>
                      </form>
                    </div>
                  )}
                />
              )}

              <form action={actions.addCharacter.bind(null, genre.id)} className="mt-3 flex gap-2">
                <input
                  name="name"
                  placeholder="새 캐릭터 이름"
                  required
                  className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:opacity-70 dark:border-neutral-700"
                >
                  캐릭터 추가
                </button>
              </form>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-neutral-500">제작한 사람</h3>
              <ul className="mb-2 flex flex-wrap gap-2">
                {genre.makers.map((maker) => (
                  <li
                    key={maker.id}
                    className="flex items-center gap-1.5 rounded-full border border-neutral-200 py-1 pr-1 pl-3 text-sm dark:border-neutral-800"
                  >
                    <EditableName name={maker.name} action={actions.renameMaker.bind(null, maker.id)} />
                    <form action={actions.deleteMaker.bind(null, maker.id)}>
                      <ConfirmSubmitButton
                        confirmMessage={`"${maker.name}"을(를) 삭제하시겠습니까?`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        ×
                      </ConfirmSubmitButton>
                    </form>
                  </li>
                ))}
                {genre.makers.length === 0 && <li className="text-sm text-neutral-500">없습니다.</li>}
              </ul>
              <form action={actions.addMaker.bind(null, genre.id)} className="flex gap-2">
                <input
                  name="name"
                  placeholder="새 제작자 이름"
                  required
                  className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:opacity-70 dark:border-neutral-700"
                >
                  제작자 추가
                </button>
              </form>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-500">공구 개최한 사람</h3>
              <ul className="mb-2 flex flex-wrap gap-2">
                {genre.organizers.map((organizer) => (
                  <li
                    key={organizer.id}
                    className="flex items-center gap-1.5 rounded-full border border-neutral-200 py-1 pr-1 pl-3 text-sm dark:border-neutral-800"
                  >
                    <EditableName name={organizer.name} action={actions.renameOrganizer.bind(null, organizer.id)} />
                    <form action={actions.deleteOrganizer.bind(null, organizer.id)}>
                      <ConfirmSubmitButton
                        confirmMessage={`"${organizer.name}"을(를) 삭제하시겠습니까?`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        ×
                      </ConfirmSubmitButton>
                    </form>
                  </li>
                ))}
                {genre.organizers.length === 0 && <li className="text-sm text-neutral-500">없습니다.</li>}
              </ul>
              <form action={actions.addOrganizer.bind(null, genre.id)} className="flex gap-2">
                <input
                  name="name"
                  placeholder="새 공구자 이름"
                  required
                  className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:opacity-70 dark:border-neutral-700"
                >
                  공구자 추가
                </button>
              </form>
            </div>
          </details>
        </div>
      )}
    />
  );
}
