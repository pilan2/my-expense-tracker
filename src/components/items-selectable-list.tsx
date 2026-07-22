"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberInput } from "@/components/number-input";
import { ItemCardContent } from "@/components/item-card";
import { itemHref } from "@/lib/nav";

type Item = Parameters<typeof ItemCardContent>[0] & { id: string };
type Subgroup = { character: string; series: string | null; items: Item[] };
type GenreGroup = { genre: string; subgroups: Subgroup[] };

export function ItemsSelectableList({
  groups,
  pendingOnly,
}: {
  groups: GenreGroup[];
  pendingOnly: boolean;
}) {
  const [selectMode, setSelectMode] = useState(false);

  return (
    <>
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
                  className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            )}
            <div className="flex gap-2">
              {pendingOnly ? (
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  배송비 나누기
                </button>
              ) : (
                <button
                  type="submit"
                  formMethod="get"
                  formAction="/items/bulk-sale"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  선택 완료 →
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectMode(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 hover:opacity-70 dark:border-neutral-700"
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setSelectMode(true)}
            className="self-start rounded-md border border-neutral-300 px-4 py-2 hover:opacity-70 dark:border-neutral-700"
          >
            {pendingOnly ? "배송비 나누기" : "묶음 판매"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((genreGroup) => (
          <div key={genreGroup.genre}>
            <h2 className="mb-2 text-xl font-semibold">{genreGroup.genre}</h2>
            <div className="flex flex-col gap-4">
              {genreGroup.subgroups.map((subgroup) => (
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
                          <input type="checkbox" name="itemIds" value={item.id} className="mt-1 h-4 w-4" />
                        )}
                        <Link
                          href={itemHref(item.id, pendingOnly ? "/items?pending=1" : "/items")}
                          className="flex-1 hover:opacity-70"
                        >
                          <ItemCardContent {...item} showGenreCharacter={false} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
