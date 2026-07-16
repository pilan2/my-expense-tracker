import { getGenreCatalog } from "@/lib/catalog";
import { addGenre, deleteGenre, addCharacter, deleteCharacter } from "@/lib/actions/catalog";
import { BackButton } from "@/components/back-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function CatalogPage() {
  const genres = await getGenreCatalog();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/items" />
      <h1 className="mb-2 text-xl font-semibold">장르/캐릭터 관리</h1>
      <p className="mb-6 text-sm text-neutral-500">
        여기서 추가/삭제한 목록은 품목 등록 화면의 버튼 선택지에 반영돼요. 삭제해도 이미 등록된
        품목의 값은 그대로 남아있고, 앞으로 선택지에서만 빠집니다.
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
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{genre.name}</h2>
                <form action={deleteGenre.bind(null, genre.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`"${genre.name}" 장르를 삭제하시겠습니까? 이 장르에 속한 캐릭터 목록도 함께 삭제됩니다.`}
                    className="text-sm text-red-600 hover:underline"
                  >
                    장르 삭제
                  </ConfirmSubmitButton>
                </form>
              </div>

              <ul className="mb-3 flex flex-wrap gap-2">
                {genre.characters.map((character) => (
                  <li
                    key={character.id}
                    className="flex items-center gap-1.5 rounded-full border border-neutral-200 py-1 pr-1 pl-3 text-sm dark:border-neutral-800"
                  >
                    {character.name}
                    <form action={deleteCharacter.bind(null, character.id)}>
                      <ConfirmSubmitButton
                        confirmMessage={`"${character.name}" 캐릭터를 삭제하시겠습니까?`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        ×
                      </ConfirmSubmitButton>
                    </form>
                  </li>
                ))}
                {genre.characters.length === 0 && (
                  <li className="text-sm text-neutral-500">캐릭터가 없습니다.</li>
                )}
              </ul>

              <form action={addCharacter.bind(null, genre.id)} className="flex gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
}
