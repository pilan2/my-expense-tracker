import { LocalForm } from "@/components/local-form";
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
} from "@/lib/actions/catalog";
import { BackButton } from "@/components/back-button";
import { GenreList } from "@/components/genre-list";
import { ItemTypeList } from "@/components/item-type-list";
import { buttonClass, inputClass, PageHeader } from "@/components/ui";

export default  function CatalogPage() {
  const [genres, itemTypes] = [getGenreCatalog(), getItemTypeCatalog()] as const;

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/items" />
      <PageHeader
        title="장르/캐릭터 관리"
        description="✎ 이름 바꾸기 · ⠿ 끌어서 순서 바꾸기"
      />

      <LocalForm action={addGenre} className="mb-8 flex gap-2">
        <input
          name="name"
          placeholder="새 장르 이름"
          required
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="submit"
          className={buttonClass()}
        >
          장르 추가
        </button>
      </LocalForm>

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
        }}
      />

      <div className="mt-8 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-semibold">물품 종류</h2>
        <p className="mb-3 text-sm text-neutral-500">장르/캐릭터와 무관하게 전역으로 사용되는 목록이에요.</p>
        <ItemTypeList itemTypes={itemTypes} actions={{ deleteItemType, renameItemType, reorderItemTypes }} />
        <LocalForm action={addItemType} className="flex gap-2">
          <input
            name="name"
            placeholder="새 물품 종류 이름"
            required
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="submit"
            className={buttonClass("secondary")}
          >
            물품 종류 추가
          </button>
        </LocalForm>
      </div>
    </div>
  );
}
