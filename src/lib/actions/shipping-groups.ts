import { localAction } from "@/lib/local/action";

import { transactionDb as db } from "@/lib/local/repository";
import { autoAssignShippingGroup } from "@/lib/shipping-group-matching";


export const renameShippingGroup = localAction(async function renameShippingGroup(id: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("이름을 입력해주세요.");

  await db.shippingGroup.update({ where: { id }, data: { label } });
});

// 그룹에 남아있는(아직 발송 안 된) 품목 전체에 발송예정일을 한 번에 적용한다.
export const bulkSetShipDate = localAction(async function bulkSetShipDate(groupId: string, formData: FormData) {
  const dateRaw = formData.get("expectedShipDate");
  const monthRaw = formData.get("expectedShipMonth");

  let expectedShipDate: Date;
  let shipDateApprox = false;
  if (monthRaw) {
    expectedShipDate = new Date(`${String(monthRaw)}-01`);
    shipDateApprox = true;
  } else if (dateRaw) {
    expectedShipDate = new Date(String(dateRaw));
  } else {
    throw new Error("발송예정일을 입력해주세요.");
  }

  await db.item.updateMany({
    where: { shippingGroupId: groupId, isPhysical: false },
    data: { expectedShipDate, shipDateApprox },
  });
});

export const removeFromShippingGroup = localAction(async function removeFromShippingGroup(itemId: string) {
  await db.item.update({ where: { id: itemId }, data: { shippingGroupId: null } });
});

export const addItemsToShippingGroup = localAction(async function addItemsToShippingGroup(groupId: string, formData: FormData) {
  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);
  if (itemIds.length === 0) return;

  await db.item.updateMany({ where: { id: { in: itemIds } }, data: { shippingGroupId: groupId } });
});

// 이 기능이 생기기 전에 등록된 품목들은 저장 시점에 자동 그룹화가 걸리지 않았으므로, 아직
// 그룹에 없는 미현물 품목 전체를 다시 훑어서 매칭을 시도한다. 이미 그룹에 들어간 품목은
// 건드리지 않는다(사용자가 직접 뺐을 수 있으므로).
export const backfillShippingGroups = localAction(async function backfillShippingGroups() {

  const candidates = await db.item.findMany({
    where: {
      isPhysical: false,
      shippingGroupId: null,
      purchasedAt: { not: null },
      OR: [{ maker: { not: null } }, { organizer: { not: null } }],
    },
    select: { id: true },
    orderBy: [{ purchasedAt: "asc" }, { createdAt: "asc" }],
  });

  for (const candidate of candidates) {
    // 앞선 루프에서 이미 다른 그룹에 같이 묶였을 수 있으니, 매번 최신 상태를 다시 읽는다.
    const fresh = await db.item.findUnique({
      where: { id: candidate.id },
      select: { id: true, purchasedAt: true, maker: true, organizer: true, isPhysical: true, shippingGroupId: true },
    });
    if (fresh) await autoAssignShippingGroup(fresh);
  }

});
