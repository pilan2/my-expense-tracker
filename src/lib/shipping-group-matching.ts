import { transactionDb as db } from "@/lib/local/repository";
import { formatDate, formatShipDateLabel } from "@/lib/dday";

type Matchable = {
  id: string;
  purchasedAt: Date | null;
  maker: string | null;
  organizer: string | null;
  isPhysical: boolean;
  expectedShipDate: Date | null;
  shipDateApprox: boolean;
  shippingGroupId: string | null;
};

// 같은 날 산 품목 중 (1) 제작자나 공구자가 같거나, (2) 제작자·공구자를 안 적었어도 발송 예정일이
// 같으면 함께 발송되는 것으로 본다. 둘 다 적혀 있는데 서로 다르면 다른 판매처이므로 묶지 않는다.
export function isSameShipment(a: Matchable, b: Matchable) {
  if (!a.purchasedAt || !b.purchasedAt || a.purchasedAt.getTime() !== b.purchasedAt.getTime()) return false;
  if ((a.maker && a.maker === b.maker) || (a.organizer && a.organizer === b.organizer)) return true;
  const conflicting = (a.maker && b.maker && a.maker !== b.maker) || (a.organizer && b.organizer && a.organizer !== b.organizer);
  return !conflicting && !!a.expectedShipDate && !!b.expectedShipDate
    && a.expectedShipDate.getTime() === b.expectedShipDate.getTime() && a.shipDateApprox === b.shipDateApprox;
}

// 위 기준에 맞는, 아직 현물이 아닌 다른 품목이 있으면 자동으로 같은 발송 그룹에 넣는다. 이미 그룹에
// 들어간 품목은 사용자가 직접 뺐을 수도 있으니 건드리지 않는다. 품목 저장 시(생성/수정)와, 기존 품목을
// 한꺼번에 재검사하는 백필(backfillShippingGroups) 양쪽에서 같이 쓴다.
export async function autoAssignShippingGroup(item: Matchable) {
  if (item.isPhysical || item.shippingGroupId || !item.purchasedAt) return;

  const candidates = (await db.item.findMany({
    where: { id: { not: item.id }, isPhysical: false, purchasedAt: item.purchasedAt },
  })).filter((other) => isSameShipment(item, other));
  if (candidates.length === 0) return;

  const existingGroupId = candidates.find((c) => c.shippingGroupId)?.shippingGroupId;
  if (existingGroupId) {
    await db.item.update({ where: { id: item.id }, data: { shippingGroupId: existingGroupId } });
    return;
  }

  const named = [item, ...candidates].find((c) => c.maker || c.organizer);
  const source = named?.maker ?? named?.organizer;
  const label = source
    ? `${source} · ${formatDate(item.purchasedAt)} 구매`
    : `${formatDate(item.purchasedAt)} 구매 · ${formatShipDateLabel(item.expectedShipDate!, item.shipDateApprox)} 발송`;
  const group = await db.shippingGroup.create({ data: { label } });
  await db.item.updateMany({
    where: { id: { in: [item.id, ...candidates.map((c) => c.id)] } },
    data: { shippingGroupId: group.id },
  });
}
