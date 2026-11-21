"use client";

import { LocalForm } from "@/components/local-form";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EditableName } from "@/components/editable-name";
import { DragHandle, SortableList } from "@/components/sortable-list";
import type { GenreCatalogEntry } from "@/lib/catalog";
import { buttonClass, inputClass, EmptyState } from "@/components/ui";

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
>;

// /catalog의 장르 카드 목록. 장르 순서와, 각 장르 안 캐릭터 순서를 드래그로 바꿀 수 있다.
// 두 단계 모두 각자 독립된 드래그 영역이라(장르끼리만, 같은 장르의 캐릭터끼리만 섞임),
// 중첩된 SortableList 두 개로 구성한다.
export function GenreList({ genres, actions }: { genres: GenreCatalogEntry[]; actions: CatalogActions }) {
  if (genres.length === 0) {
    return <EmptyState>등록된 장르가 없습니다.</EmptyState>;
  }

  return (
    <SortableList
      items={genres}
      onReorder={actions.reorderGenres}
      dndId="genres"
      className="flex flex-col gap-6"
      renderItem={(genre, handle) => (
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DragHandle {...handle} />
              <h2 className="font-semibold">
                <EditableName name={genre.name} action={actions.renameGenre.bind(null, genre.id)} />
              </h2>
            </div>
            <LocalForm action={actions.deleteGenre.bind(null, genre.id)}>
              <ConfirmSubmitButton
                confirmMessage={`"${genre.name}" 장르를 삭제할까요? 이 장르에 속한 캐릭터/시리즈/제작자/공구자 목록도 함께 삭제됩니다.`}
                className={buttonClass("dangerGhost")}
              >
                장르 삭제
              </ConfirmSubmitButton>
            </LocalForm>
          </div>

          <details>
            <summary className="mb-4 flex min-h-11 cursor-pointer items-center text-sm underline">자세히 보기</summary>

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
                    <div className="rounded-2xl border border-line bg-surface shadow-card p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DragHandle {...charHandle} />
                          <span className="text-sm font-medium">
                            <EditableName name={character.name} action={actions.renameCharacter.bind(null, character.id)} />
                          </span>
                        </div>
                        <LocalForm action={actions.deleteCharacter.bind(null, character.id)}>
                          <ConfirmSubmitButton
                            confirmMessage={`"${character.name}" 캐릭터를 삭제할까요? 이 캐릭터의 시리즈 목록도 함께 삭제됩니다.`}
                            className={buttonClass("dangerGhost")}
                          >
                            캐릭터 삭제
                          </ConfirmSubmitButton>
                        </LocalForm>
                      </div>

                      <ul className="mb-2 flex flex-wrap gap-1.5">
                        {character.series.map((series) => (
                          <li
                            key={series.id}
                            className="flex items-center gap-1 rounded-full border border-neutral-200 py-0.5 pr-1 pl-2 text-xs dark:border-neutral-800"
                          >
                            <EditableName name={series.name} action={actions.renameSeries.bind(null, series.id)} />
                            <LocalForm action={actions.deleteSeries.bind(null, series.id)}>
                              <ConfirmSubmitButton
                                confirmMessage={`"${series.name}" 시리즈를 삭제할까요?`}
                                className="flex h-4 w-4 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              >
                                ×
                              </ConfirmSubmitButton>
                            </LocalForm>
                          </li>
                        ))}
                        {character.series.length === 0 && (
                          <li className="text-xs text-neutral-500">시리즈가 없습니다.</li>
                        )}
                      </ul>

                      <LocalForm action={actions.addSeries.bind(null, character.id)} className="flex gap-2">
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
                      </LocalForm>
                    </div>
                  )}
                />
              )}

              <LocalForm action={actions.addCharacter.bind(null, genre.id)} className="mt-3 flex gap-2">
                <input
                  name="name"
                  placeholder="새 캐릭터 이름"
                  required
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="submit"
                  className={buttonClass("secondary")}
                >
                  캐릭터 추가
                </button>
              </LocalForm>
            </div>

          </details>
        </div>
      )}
    />
  );
}
