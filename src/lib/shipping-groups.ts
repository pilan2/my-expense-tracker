import "server-only";
import { prisma } from "@/lib/prisma";

// 목록에서는 아직 발송 안 된(현물 아닌) 품목이 하나라도 남아있는 그룹만 보여준다.
// 다 받은 그룹은 더 이상 발송일을 관리할 필요가 없어서 목록에서 자연스럽게 빠진다.
export function getShippingGroups() {
  return prisma.shippingGroup.findMany({
    where: { items: { some: { isPhysical: false } } },
    include: {
      items: {
        select: {
          id: true,
          isPhysical: true,
          expectedShipDate: true,
          shipDateApprox: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getShippingGroup(id: string) {
  return prisma.shippingGroup.findUnique({
    where: { id },
    include: {
      items: {
        select: {
          id: true,
          genre: true,
          character: true,
          detail: true,
          isPhysical: true,
          expectedShipDate: true,
          shipDateApprox: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// 그룹에 새로 넣을 수 있는, 아직 어느 그룹에도 안 들어간 미현물 품목 목록(추가 선택지용).
export function getUngroupedPendingItems() {
  return prisma.item.findMany({
    where: { isPhysical: false, shippingGroupId: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, genre: true, character: true, detail: true },
  });
}
