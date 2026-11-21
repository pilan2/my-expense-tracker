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

// 함께 발송되는 품목으로 보는 기준:
// (1) 발송 예정일이 같다(정확한 날짜끼리, 또는 같은 달의 월 단위끼리). 구매일이 달라도 통합 배송으로
//     같은 날 발송되는 경우가 있어 구매일은 보지 않는다.
// (2) 발송일을 모르더라도 같은 날 같은 제작자·공구자에게 산 품목.
// 어느 경우든 제작자·공구자가 양쪽에 다 적혀 있는데 서로 다르면 다른 판매처이므로 묶지 않는다.
export function isSameShipment(a: Matchable, b: Matchable) {
  const conflicting = (a.maker && b.maker && a.maker !== b.maker) || (a.organizer && b.organizer && a.organizer !== b.organizer);
  if (conflicting) return false;
  if (a.expectedShipDate && b.expectedShipDate) {
    return a.expectedShipDate.getTime() === b.expectedShipDate.getTime() && a.shipDateApprox === b.shipDateApprox;
  }
  const sameDay = !!a.purchasedAt && !!b.purchasedAt && a.purchasedAt.getTime() === b.purchasedAt.getTime();
  return sameDay && ((!!a.maker && a.maker === b.maker) || (!!a.organizer && a.organizer === b.organizer));
}

// 위 기준에 맞는, 아직 현물이 아닌 다른 품목이 있으면 자동으로 같은 발송 그룹에 넣는다. 이미 그룹에
// 들어간 품목은 사용자가 직접 옮겼을 수도 있으니 건드리지 않는다. 품목 저장 시(생성/수정)와, 기존 품목을
// 한꺼번에 재검사하는 백필(backfillShippingGroups) 양쪽에서 같이 쓴다.
export async function autoAssignShippingGroup(item: Matchable) {
  if (item.isPhysical || item.shippingGroupId) return;

  const candidates = (await db.item.findMany({
    where: { id: { not: item.id }, isPhysical: false },
  })).filter((other) => isSameShipment(item, other));
  if (candidates.length === 0) return;

  const existingGroupId = candidates.find((c) => c.shippingGroupId)?.shippingGroupId;
  if (existingGroupId) {
    await db.item.update({ where: { id: item.id }, data: { shippingGroupId: existingGroupId } });
    return;
  }

  const group = await db.shippingGroup.create({ data: { label: shippingGroupLabel([item, ...candidates]) } });
  await db.item.updateMany({
    where: { id: { in: [item.id, ...candidates.map((c) => c.id)] } },
    data: { shippingGroupId: group.id },
  });
}

// 그룹 이름은 판매처(있으면)와 발송일, 발송일을 모르면 구매일로 짓는다.
export function shippingGroupLabel(items: Pick<Matchable, "maker" | "organizer" | "purchasedAt" | "expectedShipDate" | "shipDateApprox">[]) {
  const named = items.find((c) => c.maker || c.organizer);
  const source = named?.maker ?? named?.organizer;
  const shipped = items.find((c) => c.expectedShipDate);
  const when = shipped ? `${formatShipDateLabel(shipped.expectedShipDate!, shipped.shipDateApprox)} 발송`
    : items[0].purchasedAt ? `${formatDate(items[0].purchasedAt)} 구매` : "발송 그룹";
  return source ? `${source} · ${when}` : when;
}
