"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { autoAssignShippingGroup } from "@/lib/shipping-group-matching";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function revalidateShipmentPaths(groupId: string) {
  revalidatePath("/items");
  revalidatePath("/shipments");
  revalidatePath("/shipping-groups");
  revalidatePath(`/shipping-groups/${groupId}`);
  revalidatePath("/");
}

export async function renameShippingGroup(id: string, formData: FormData) {
  await requireAuth();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("이름을 입력해주세요.");

  await prisma.shippingGroup.update({ where: { id }, data: { label } });
  revalidatePath("/shipping-groups");
  revalidatePath(`/shipping-groups/${id}`);
}

// 그룹에 남아있는(아직 발송 안 된) 품목 전체에 발송예정일을 한 번에 적용한다.
export async function bulkSetShipDate(groupId: string, formData: FormData) {
  await requireAuth();
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

  await prisma.item.updateMany({
    where: { shippingGroupId: groupId, isPhysical: false },
    data: { expectedShipDate, shipDateApprox },
  });
  revalidateShipmentPaths(groupId);
}

export async function removeFromShippingGroup(itemId: string, groupId: string) {
  await requireAuth();
  await prisma.item.update({ where: { id: itemId }, data: { shippingGroupId: null } });
  revalidateShipmentPaths(groupId);
}

export async function addItemsToShippingGroup(groupId: string, formData: FormData) {
  await requireAuth();
  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);
  if (itemIds.length === 0) return;

  await prisma.item.updateMany({ where: { id: { in: itemIds } }, data: { shippingGroupId: groupId } });
  revalidateShipmentPaths(groupId);
}

// 이 기능이 생기기 전에 등록된 품목들은 저장 시점에 자동 그룹화가 걸리지 않았으므로, 아직
// 그룹에 없는 미현물 품목 전체를 다시 훑어서 매칭을 시도한다. 이미 그룹에 들어간 품목은
// 건드리지 않는다(사용자가 직접 뺐을 수 있으므로).
export async function backfillShippingGroups() {
  await requireAuth();

  const candidates = await prisma.item.findMany({
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
    const fresh = await prisma.item.findUnique({
      where: { id: candidate.id },
      select: { id: true, purchasedAt: true, maker: true, organizer: true, isPhysical: true, shippingGroupId: true },
    });
    if (fresh) await autoAssignShippingGroup(fresh);
  }

  revalidatePath("/items");
  revalidatePath("/shipments");
  revalidatePath("/shipping-groups");
}
