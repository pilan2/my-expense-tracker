import Link from "next/link";
import { notFound } from "next/navigation";
import { getShippingGroup, getUngroupedPendingItems } from "@/lib/shipping-groups";
import {
  renameShippingGroup,
  bulkSetShipDate,
  removeFromShippingGroup,
  addItemsToShippingGroup,
} from "@/lib/actions/shipping-groups";
import { BackButton } from "@/components/back-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EditGroupLabelForm } from "@/components/edit-group-label-form";
import { ShipDateInput } from "@/components/ship-date-input";
import { AddGroupItemsForm } from "@/components/add-group-items-form";
import { formatShipDateLabel, formatShipDDay, isShipmentOverdue } from "@/lib/dday";
import { itemHref } from "@/lib/nav";

export default async function ShippingGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [group, ungroupedItems] = await Promise.all([getShippingGroup(id), getUngroupedPendingItems()]);

  if (!group) notFound();

  const from = `/shipping-groups/${id}`;
  const pendingItems = group.items.filter((item) => !item.isPhysical);
  const deliveredItems = group.items.filter((item) => item.isPhysical);

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href="/shipping-groups" />
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold">{group.label}</h1>
        <EditGroupLabelForm currentLabel={group.label} action={renameShippingGroup.bind(null, group.id)} />
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        발송 대기 {pendingItems.length}개 · 배송 완료 {deliveredItems.length}개
      </p>

      {pendingItems.length > 0 && (
        <form
          action={bulkSetShipDate.bind(null, group.id)}
          className="mb-8 flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <p className="text-sm font-medium">발송예정일 일괄 수정</p>
          <p className="text-xs text-neutral-500">발송 대기 중인 {pendingItems.length}개 품목 전체에 적용돼요.</p>
          <ShipDateInput label="새 발송예정일" />
          <button
            type="submit"
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
          >
            전체 적용
          </button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {pendingItems.length > 0 && (
          <div>
            <h2 className="mb-2 text-base font-medium">발송 대기</h2>
            <ul className="flex flex-col gap-2">
              {pendingItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <div className="min-w-0 flex-1">
                    <Link href={itemHref(item.id, from)} className="hover:opacity-70">
                      <p className="text-sm font-medium">
                        {item.genre} · {item.character} · {item.detail}
                      </p>
                    </Link>
                    {item.expectedShipDate && (
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {isShipmentOverdue(item.expectedShipDate, item.shipDateApprox)
                          ? `배송중 (발송예정 ${formatShipDateLabel(item.expectedShipDate, item.shipDateApprox)})`
                          : `발송예정 ${formatShipDateLabel(item.expectedShipDate, item.shipDateApprox)} · ${formatShipDDay(item.expectedShipDate, item.shipDateApprox)}`}
                      </p>
                    )}
                  </div>
                  <form action={removeFromShippingGroup.bind(null, item.id, group.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="이 품목을 그룹에서 빼시겠습니까?"
                      className="shrink-0 text-xs text-red-600 hover:underline"
                    >
                      그룹에서 빼기
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}

        {deliveredItems.length > 0 && (
          <div>
            <h2 className="mb-2 text-base font-medium text-neutral-500">배송 완료</h2>
            <ul className="flex flex-col gap-2">
              {deliveredItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 p-3 opacity-60 dark:border-neutral-800"
                >
                  <Link href={itemHref(item.id, from)} className="min-w-0 flex-1 truncate text-sm hover:opacity-70">
                    {item.genre} · {item.character} · {item.detail}
                  </Link>
                  <form action={removeFromShippingGroup.bind(null, item.id, group.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="이 품목을 그룹에서 빼시겠습니까?"
                      className="shrink-0 text-xs text-red-600 hover:underline"
                    >
                      그룹에서 빼기
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-8 border-t pt-6 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-medium">품목 추가</h2>
        <AddGroupItemsForm action={addItemsToShippingGroup.bind(null, group.id)} itemOptions={ungroupedItems} />
      </div>
    </div>
  );
}
