"use client";

import { useState } from "react";
import { LocalForm } from "@/components/local-form";
import { assignShippingFee } from "@/lib/actions/shipping";
import { itemFilterHref, itemStatusFilters, matchesItemFilter, type ItemStatusFilter, type ItemView } from "@/lib/item-filter";
import Link from "@/lib/local/navigation";
import { ItemThumb } from "@/components/item-card";
import { itemStatusChip } from "@/lib/item-status";
import { won } from "@/lib/money";
import { ItemCardWithDelivery } from "@/components/item-card-with-delivery";
import { itemHref } from "@/lib/nav";
import { buttonClass, inputClass, chipClass, EmptyState } from "@/components/ui";
import { ManwonInput } from "@/components/manwon-input";

type Item = Omit<Parameters<typeof ItemCardWithDelivery>[0], "href"> & {
  maker: string | null; organizer: string | null; memo: string | null;
};
type Subgroup = { character: string; series: string | null; items: Item[] };
type GenreGroup = { genre: string; subgroups: Subgroup[] };

export function ItemsSelectableList({
  groups,
  initialQuery,
  initialStatus,
  initialView,
}: {
  groups: GenreGroup[];
  initialQuery: string;
  initialStatus: ItemStatusFilter;
  initialView: ItemView;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [view, setView] = useState(initialView);
  const pendingOnly = status === "shipping-fee";
  const from = itemFilterHref(query, status, view);
  // 선택 모드에서는 체크박스가 필요해 목록 보기로만 보여준다.
  const showGrid = view === "grid" && !selectMode;

  // 입력할 때마다 화면을 다시 열면 검색창 포커스가 사라지므로, 주소만 조용히 바꿔서
  // 상세에서 돌아왔을 때와 새로고침 때 같은 검색 결과를 다시 보여준다.
  function update(nextQuery: string, nextStatus: ItemStatusFilter, nextView: ItemView = view) {
    setQuery(nextQuery); setStatus(nextStatus); setView(nextView);
    if (nextStatus !== status) setSelectMode(false);
    try { history.replaceState(history.state, "", itemFilterHref(nextQuery, nextStatus, nextView)); } catch {}
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
  const allItems = groups.flatMap((g) => g.subgroups.flatMap((sg) => sg.items));
  const countFor = (filter: ItemStatusFilter) => allItems.filter((item) => matchesItemFilter(item, query, filter)).length;

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
        <div role="group" aria-label="상태 필터" className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
          {itemStatusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={status === filter.id}
              onClick={() => update(query, filter.id)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm ${
                status === filter.id
                  ? "border-accent bg-accent font-semibold text-on-accent"
                  : "border-line bg-surface"
              }`}
            >
              {filter.label} <span className="opacity-70">{countFor(filter.id)}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="text-sm text-muted">{resultCount}개 품목</p>
          <div role="group" aria-label="보기 방식" className="flex rounded-xl bg-surface-soft p-1">
            {(["list", "grid"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                aria-label={option === "list" ? "목록 보기" : "사진 그리드 보기"}
                onClick={() => update(query, status, option)}
                className={`flex h-9 w-11 items-center justify-center rounded-lg ${view === option ? "bg-surface text-accent shadow-card" : "text-muted"}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d={option === "list" ? "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" : "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {resultCount === 0 ? (
        <EmptyState>
          {groups.length === 0 ? "등록된 품목이 없습니다." : pendingOnly && !query.trim() ? "배송비 미정인 품목이 없습니다." : "조건에 맞는 품목이 없습니다."}
        </EmptyState>
      ) : (
      <LocalForm action={assignShippingFee}>
      <div className={selectMode ? "mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-sm shadow-card sm:flex-row sm:items-end" : "mb-4"}>
        {selectMode ? (
          <>
            {pendingOnly && (
              <label className="flex flex-1 flex-col gap-1">
                <span className="font-medium">
                  아래에서 같이 배송받은 품목을 체크하고, 총 배송비(만원 단위)를 입력하면 각
                  품목의 수량 비율대로 나눠서 배정됩니다.
                </span>
                <ManwonInput
                  name="totalShippingFee"
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
              <h2 className="mb-3 text-xl font-bold">{genreGroup.genre}</h2>
              <div className="flex flex-col gap-4">
                {visibleSubgroups.map((subgroup) => (
                  <div key={`${subgroup.character}-${subgroup.series ?? ""}`}>
                    {/* "기타" 장르는 캐릭터도 항상 "기타"라, 장르 제목과 중복되는 캐릭터 제목은 생략한다. */}
                    {!(genreGroup.genre === "기타" && subgroup.character === "기타") && (
                      <h3 className="mb-2 flex items-baseline gap-1.5 text-base font-bold">
                        {subgroup.character}
                        <span className="text-sm font-medium text-muted">
                          {subgroup.series ? `${subgroup.series} · ` : ""}{subgroup.items.length}
                        </span>
                      </h3>
                    )}
                    {showGrid ? (
                      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {subgroup.items.map((item) => {
                          const status = itemStatusChip(item);
                          return (
                            <li key={item.id}>
                              <Link href={itemHref(item.id, from)} className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card hover:opacity-80">
                                <span className="relative block">
                                  <ItemThumb imageUrl={item.imageUrl} name={item.detail} seed={item.detail} className="aspect-square w-full text-3xl" />
                                  {status && <span className={`absolute top-2 left-2 ${chipClass(status.kind)}`}>{status.label}</span>}
                                </span>
                                <span className="flex flex-col gap-0.5 px-3 pt-2 pb-3">
                                  <span className="truncate text-sm font-semibold">{item.detail}</span>
                                  <span className="truncate text-xs text-muted">{[item.series, item.itemType].filter(Boolean).join(" · ")}</span>
                                  <span className="mt-0.5 text-sm font-semibold">{won(Number(item.price) * item.quantity)}</span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                    <ul className="flex flex-col gap-2">
                      {subgroup.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-3 rounded-2xl border border-line bg-surface shadow-card p-3"
                        >
                          {selectMode && (
                            <input type="checkbox" name="itemIds" value={item.id} className="mt-1 h-6 w-6" />
                          )}
                          <ItemCardWithDelivery {...item} href={itemHref(item.id, from)}
                            className="flex-1" showGenreCharacter={false} showDeliveryAction={!selectMode} />
                        </li>
                      ))}
                    </ul>
                    )}
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
