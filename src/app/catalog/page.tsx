import { getGenreCatalog, getItemTypeCatalog } from "@/lib/catalog";
import {
  addGenre,
  deleteGenre,
  renameGenre,
  reorderGenres,
  addCharacter,
  deleteCharacter,
  renameCharacter,
  reorderCharacters,
  addSeries,
  deleteSeries,
  renameSeries,
  addItemType,
  deleteItemType,
  renameItemType,
  reorderItemTypes,
  addMaker,
  deleteMaker,
  renameMaker,
  addOrganizer,
  deleteOrganizer,
  renameOrganizer,
} from "@/lib/actions/catalog";
import { BackButton } from "@/components/back-button";
import { GenreList } from "@/components/genre-list";
import { ItemTypeList } from "@/components/item-type-list";

export default async function CatalogPage() {
  const [genres, itemTypes] = await Promise.all([getGenreCatalog(), getItemTypeCatalog()]);

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/items" />
      <h1 className="mb-2 text-xl font-semibold">장르/캐릭터 관리</h1>
      <p className="mb-6 text-sm text-neutral-500">
        여기서 추가/삭제한 목록은 품목 등록 화면의 버튼 선택지에 반영돼요. 삭제해도 이미 등록된
        품목의 값은 그대로 남아있고, 앞으로 선택지에서만 빠집니다. 이름 옆의 ✎을 누르면 이름을
        바꿀 수 있고, 이때는 그 이름을 쓰던 품목들에도 한 번에 반영됩니다. ⠿을 눌러 끌면 순서를
        바꿀 수 있어요.
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

      <GenreList
        genres={genres}
        actions={{
          deleteGenre,
          renameGenre,
          reorderGenres,
          addCharacter,
          deleteCharacter,
          renameCharacter,
          reorderCharacters,
          addSeries,
          deleteSeries,
          renameSeries,
          addMaker,
          deleteMaker,
          renameMaker,
          addOrganizer,
          deleteOrganizer,
          renameOrganizer,
        }}
      />

      <div className="mt-8 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-2 font-semibold">물품 종류 (대분류)</h2>
        <p className="mb-3 text-sm text-neutral-500">장르/캐릭터와 무관하게 전역으로 사용되는 목록이에요.</p>
        <ItemTypeList itemTypes={itemTypes} actions={{ deleteItemType, renameItemType, reorderItemTypes }} />
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
