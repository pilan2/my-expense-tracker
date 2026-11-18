"use client";

import { useState } from "react";
import { NumberInput } from "@/components/number-input";
import { LocalForm } from "@/components/local-form";
import { assignShippingFee } from "@/lib/actions/shipping";
import { itemFilterHref, itemStatusFilters, matchesItemFilter, type ItemStatusFilter } from "@/lib/item-filter";
import { ItemCardWithDelivery } from "@/components/item-card-with-delivery";
import { itemHref } from "@/lib/nav";
import { buttonClass, inputClass, EmptyState } from "@/components/ui";

type Item = Omit<Parameters<typeof ItemCardWithDelivery>[0], "href"> & {
  maker: string | null; organizer: string | null; memo: string | null;
};
type Subgroup = { character: string; series: string | null; items: Item[] };
type GenreGroup = { genre: string; subgroups: Subgroup[] };

export function ItemsSelectableList({
  groups,
  initialQuery,
  initialStatus,
}: {
  groups: GenreGroup[];
  initialQuery: string;
  initialStatus: ItemStatusFilter;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const pendingOnly = status === "shipping-fee";
  const from = itemFilterHref(query, status);

  // 입력할 때마다 화면을 다시 열면 검색창 포커스가 사라지므로, 주소만 조용히 바꿔서
  // 상세에서 돌아왔을 때와 새로고침 때 같은 검색 결과를 다시 보여준다.
  function update(nextQuery: string, nextStatus: ItemStatusFilter) {
    setQuery(nextQuery); setStatus(nextStatus);
    if (nextStatus !== status) setSelectMode(false);
    try { history.replaceState(history.state, "", itemFilterHref(nextQuery, nextStatus)); } catch {}
  }

  const filteredGroups = groups
    .map((genreGroup) => ({
      ...genreGroup,
      subgroups: genreGroup.subgroups
        .map((subgroup) => ({ ...subgroup, items: subgroup.items.filter((item) => matchesItemFilter(item, query, status)) }))
        .filter((subgroup) => subgroup.items.length > 0),
    }))
    .filter((genreGroup) => genreGroup.subgroups.length > 0);
  const resultCount = filteredGroups.reduce((sum, g) => sum + g.subgroups.reduce((n, sg) => n + sg.items.length, 0), 0);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <input
          type="search"
          aria-label="품목 검색"
          placeholder="세부사항·캐릭터·제작자·메모 검색"
          value={query}
          onChange={(event) => update(event.target.value, status)}
          // 모바일 키보드의 검색 버튼은 키보드만 닫는다.
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }}
          className={`${inputClass} w-full`}
        />
        <div role="group" aria-label="상태 필터" className="flex flex-wrap gap-2">
          {itemStatusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={status === filter.id}
              onClick={() => update(query, filter.id)}
              className={`min-h-11 rounded-full border px-4 text-sm ${
                status === filter.id
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p role="status" className="text-sm text-neutral-500">{resultCount}개 품목</p>
      </div>

      {resultCount === 0 ? (
        <EmptyState>
          {groups.length === 0 ? "등록된 품목이 없습니다." : pendingOnly && !query.trim() ? "배송비 미정인 품목이 없습니다." : "조건에 맞는 품목이 없습니다."}
        </EmptyState>
      ) : (
      <LocalForm action={assignShippingFee}>
      <div className="mb-4 flex flex-col gap-3 rounded-md border border-neutral-200 p-4 text-sm sm:flex-row sm:items-end dark:border-neutral-800">
        {selectMode ? (
          <>
            {pendingOnly && (
              <label className="flex flex-1 flex-col gap-1">
                <span className="font-medium">
                  아래에서 같이 배송받은 품목을 체크하고, 총 배송비(만원 단위)를 입력하면 각
                  품목의 수량 비율대로 나눠서 배정됩니다.
                </span>
                <NumberInput
                  name="totalShippingFee"
                  min={0}
                  step={0.0001}
                  className={inputClass}
                />
              </label>
            )}
            <div className="flex gap-2">
              {pendingOnly ? (
                <button
                  type="submit"
                  className={buttonClass()}
                >
                  배송비 나누기
                </button>
              ) : (
                <button
                  type="submit"
                  formMethod="get"
                  formAction="/items/bulk-sale"
                  className={buttonClass()}
                >
                  선택 완료 →
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectMode(false)}
                className={buttonClass("secondary")}
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setSelectMode(true)}
            className={`self-start ${buttonClass("secondary")}`}
          >
            {pendingOnly ? "배송비 나누기" : "묶음 판매"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {filteredGroups.map((genreGroup) => {
          // 묶음 판매(배송비 나누기가 아닐 때) 선택 중에는 이미 다 팔린 품목은 더 팔 수 없으니
          // 목록 자체에서 뺀다. 그 결과 캐릭터/장르에 남는 품목이 없으면 그 제목도 같이 숨긴다.
          const visibleSubgroups = genreGroup.subgroups
            .map((subgroup) => ({
              ...subgroup,
              items:
                selectMode && !pendingOnly
                  ? subgroup.items.filter((item) => item.remainingQuantity > 0)
                  : subgroup.items,
            }))
            .filter((subgroup) => subgroup.items.length > 0);

          if (visibleSubgroups.length === 0) return null;

          return (
            <div key={genreGroup.genre}>
              <h2 className="mb-2 text-xl font-semibold">{genreGroup.genre}</h2>
              <div className="flex flex-col gap-4">
                {visibleSubgroups.map((subgroup) => (
                  <div key={`${subgroup.character}-${subgroup.series ?? ""}`}>
                    {/* "기타" 장르는 캐릭터도 항상 "기타"라, 장르 제목과 중복되는 캐릭터 제목은 생략한다. */}
                    {!(genreGroup.genre === "기타" && subgroup.character === "기타") && (
                      <h3 className="mb-2 text-base font-medium">
                        {subgroup.character}
                        {subgroup.series ? ` (${subgroup.series})` : ""}
                      </h3>
                    )}
                    <ul className="flex flex-col gap-2">
                      {subgroup.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                        >
                          {selectMode && (
                            <input type="checkbox" name="itemIds" value={item.id} className="mt-1 h-6 w-6" />
                          )}
                          <ItemCardWithDelivery {...item} href={itemHref(item.id, from)}
                            className="flex-1" showGenreCharacter={false} showDeliveryAction={!selectMode} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </LocalForm>
      )}
    </>
  );
}
