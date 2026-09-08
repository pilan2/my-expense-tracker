"use client";

import { rectSortingStrategy } from "@dnd-kit/sortable";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EditableName } from "@/components/editable-name";
import { DragHandle, SortableList } from "@/components/sortable-list";
import type { ItemTypeCatalogEntry } from "@/lib/catalog";

type ItemTypeActions = Pick<
  typeof import("@/lib/actions/catalog"),
  "deleteItemType" | "renameItemType" | "reorderItemTypes"
>;

export function ItemTypeList({
  itemTypes,
  actions,
}: {
  itemTypes: ItemTypeCatalogEntry[];
  actions: ItemTypeActions;
}) {
  if (itemTypes.length === 0) {
    return <p className="text-sm text-neutral-500">없습니다.</p>;
  }

  return (
    <SortableList
      items={itemTypes}
      onReorder={actions.reorderItemTypes}
      strategy={rectSortingStrategy}
      dndId="item-types"
      className="mb-3 flex flex-wrap gap-2"
      renderItem={(itemType, handle) => (
        <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 py-1 pr-1 pl-3 text-sm dark:border-neutral-800">
          <DragHandle {...handle} />
          <EditableName name={itemType.name} action={actions.renameItemType.bind(null, itemType.id)} />
          <form action={actions.deleteItemType.bind(null, itemType.id)}>
            <ConfirmSubmitButton
              confirmMessage={`"${itemType.name}"을(를) 삭제하시겠습니까?`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ×
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    />
  );
}
