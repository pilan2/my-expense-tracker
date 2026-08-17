import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// 같은 날 구매 + 제작자 또는 공구자가 같은, 아직 발송 그룹에 안 들어간 다른 미현물 품목이
// 있으면 자동으로 같은 발송 그룹에 넣는다. 이미 그룹에 들어간 품목은 사용자가 직접 뺐을 수도
// 있으니 건드리지 않는다. 품목 저장 시(생성/수정)와, 기존 품목을 한꺼번에 재검사하는
// 백필(backfillShippingGroups) 양쪽에서 같이 쓴다.
export async function autoAssignShippingGroup(item: {
  id: string;
  purchasedAt: Date | null;
  maker: string | null;
  organizer: string | null;
  isPhysical: boolean;
  shippingGroupId: string | null;
}) {
  if (item.isPhysical || item.shippingGroupId || !item.purchasedAt) return;
  if (!item.maker && !item.organizer) return;

  const orConditions: Prisma.ItemWhereInput[] = [];
  if (item.maker) orConditions.push({ maker: item.maker });
  if (item.organizer) orConditions.push({ organizer: item.organizer });

  const candidates = await prisma.item.findMany({
    where: {
      id: { not: item.id },
      isPhysical: false,
      purchasedAt: item.purchasedAt,
      OR: orConditions,
    },
    select: { id: true, shippingGroupId: true },
  });
  if (candidates.length === 0) return;

  const existingGroupId = candidates.find((c) => c.shippingGroupId)?.shippingGroupId;
  if (existingGroupId) {
    await prisma.item.update({ where: { id: item.id }, data: { shippingGroupId: existingGroupId } });
    return;
  }

  const label = `${item.maker ?? item.organizer} · ${item.purchasedAt.toLocaleDateString("ko-KR")} 구매`;
  const group = await prisma.shippingGroup.create({ data: { label } });
  await prisma.item.updateMany({
    where: { id: { in: [item.id, ...candidates.map((c) => c.id)] } },
    data: { shippingGroupId: group.id },
  });
}
