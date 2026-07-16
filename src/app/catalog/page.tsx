import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import {
  addGenre,
  deleteGenre,
  renameGenre,
  addCharacter,
  deleteCharacter,
  renameCharacter,
  addSeries,
  deleteSeries,
  renameSeries,
  addItemType,
  deleteItemType,
  renameItemType,
  addMaker,
  deleteMaker,
  renameMaker,
  addOrganizer,
  deleteOrganizer,
  renameOrganizer,
} from "@/lib/actions/catalog";
import { BackButton } from "@/components/back-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EditableName } from "@/components/editable-name";

export default async function CatalogPage() {
  const [genres, itemTypes] = await Promise.all([getGenreCatalog(), getItemTypeCatalog()]);

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/items" />
      <h1 className="mb-2 text-xl font-semibold">장르/캐릭터 관리</h1>
      <p className="mb-6 text-sm text-neutral-500">
        여기서 추가/삭제한 목록은 품목 등록 화면의 버튼 선택지에 반영돼요. 삭제해도 이미 등록된
        품목의 값은 그대로 남아있고, 앞으로 선택지에서만 빠집니다. 이름 옆의 ✎을 누르면 이름을
        바꿀 수 있고, 이때는 그 이름을 쓰던 품목들에도 한 번에 반영됩니다.
      </p>

      <form action={addGenre} className="mb-8 flex gap-2">
        <input
          name="name"
          placeholder="새 장르 이름"
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          장르 추가
        </button>
      </form>

      {genres.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">등록된 장르가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {genres.map((genre) => (
            <div key={genre.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">
                  <EditableName name={genre.name} action={renameGenre.bind(null, genre.id)} />
                </h2>
                <form action={deleteGenre.bind(null, genre.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`"${genre.name}" 장르를 삭제하시겠습니까? 이 장르에 속한 캐릭터/시리즈/제작자/공구자 목록도 함께 삭제됩니다.`}
                    className="text-sm text-red-600 hover:underline"
                  >
                    장르 삭제
                  </ConfirmSubmitButton>
                </form>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-neutral-500">캐릭터</h3>
                <div className="flex flex-col gap-3">
                  {genre.characters.map((character) => (
                    <div key={character.id} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          <EditableName name={character.name} action={renameCharacter.bind(null, character.id)} />
                        </span>
                        <form action={deleteCharacter.bind(null, character.id)}>
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
                            <EditableName name={series.name} action={renameSeries.bind(null, series.id)} />
                            <form action={deleteSeries.bind(null, series.id)}>
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

                      <form action={addSeries.bind(null, character.id)} className="flex gap-2">
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
                  ))}
                  {genre.characters.length === 0 && (
                    <p className="text-sm text-neutral-500">캐릭터가 없습니다.</p>
                  )}
                </div>

                <form action={addCharacter.bind(null, genre.id)} className="mt-3 flex gap-2">
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
                      <EditableName name={maker.name} action={renameMaker.bind(null, maker.id)} />
                      <form action={deleteMaker.bind(null, maker.id)}>
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
                <form action={addMaker.bind(null, genre.id)} className="flex gap-2">
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
                      <EditableName name={organizer.name} action={renameOrganizer.bind(null, organizer.id)} />
                      <form action={deleteOrganizer.bind(null, organizer.id)}>
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
                <form action={addOrganizer.bind(null, genre.id)} className="flex gap-2">
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
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-2 font-semibold">물품 종류 (대분류)</h2>
        <p className="mb-3 text-sm text-neutral-500">장르/캐릭터와 무관하게 전역으로 사용되는 목록이에요.</p>
        <ul className="mb-3 flex flex-wrap gap-2">
          {itemTypes.map((itemType) => (
            <li
              key={itemType.id}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 py-1 pr-1 pl-3 text-sm dark:border-neutral-800"
            >
              <EditableName name={itemType.name} action={renameItemType.bind(null, itemType.id)} />
              <form action={deleteItemType.bind(null, itemType.id)}>
                <ConfirmSubmitButton
                  confirmMessage={`"${itemType.name}"을(를) 삭제하시겠습니까?`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  ×
                </ConfirmSubmitButton>
              </form>
            </li>
          ))}
          {itemTypes.length === 0 && <li className="text-sm text-neutral-500">없습니다.</li>}
        </ul>
        <form action={addItemType} className="flex gap-2">
          <input
            name="name"
            placeholder="새 물품 종류 이름"
            required
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:opacity-70 dark:border-neutral-700"
          >
            물품 종류 추가
          </button>
        </form>
      </div>
    </div>
  );
}
