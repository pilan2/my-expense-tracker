import type { Item } from "@/lib/local/models";

type Linkable = Pick<Item, "id" | "productGroupId">;

// 두 품목을 같은 물품으로 묶을 때 바꿀 값. 둘 다 다른 묶음에 있으면 target 쪽 묶음 전체를 합친다.
export function planProductLink(source: Linkable, target: Linkable, all: Linkable[]) {
  if (source.id === target.id) throw new Error("같은 품목끼리는 연결할 수 없습니다.");
  if (source.productGroupId && source.productGroupId === target.productGroupId) return { groupId: source.productGroupId, ids: [] };
  const groupId = source.productGroupId ?? target.productGroupId ?? crypto.randomUUID();
  const ids = new Set([source.id, target.id]);
  if (target.productGroupId) for (const item of all) if (item.productGroupId === target.productGroupId) ids.add(item.id);
  return { groupId, ids: [...ids].filter(id => all.find(item => item.id === id)?.productGroupId !== groupId) };
}

// 같은 물품 묶음 안의 구매 건을 비교하기 위한 합계. 평균 단가는 수량 가중이며 배송비는 제외한다.
export function summarizeProductGroup(items: { quantity: number; remainingQuantity: number; price: number }[]) {
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const prices = items.map(item => item.price);
  return {
    count: items.length,
    quantity,
    remainingQuantity: items.reduce((sum, item) => sum + item.remainingQuantity, 0),
    averagePrice: quantity > 0 ? Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) / quantity) : 0,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

// 목록 순서를 유지하면서, 같은 묶음 품목이 2개 이상이면 첫 품목 자리에 하나로 모은다.
export function collapseProductGroups<T extends Linkable>(items: T[]) {
  const counts = countProductGroups(items);
  const entries: { key: string; items: T[] }[] = [];
  const byGroup = new Map<string, T[]>();
  for (const item of items) {
    const groupId = item.productGroupId;
    if (!groupId || counts.get(groupId)! < 2) { entries.push({ key: item.id, items: [item] }); continue; }
    const existing = byGroup.get(groupId);
    if (existing) { existing.push(item); continue; }
    const group = [item];
    byGroup.set(groupId, group);
    entries.push({ key: `group:${groupId}`, items: group });
  }
  return entries;
}

export function countProductGroups(items: Linkable[]) {
  const counts = new Map<string, number>();
  for (const item of items) if (item.productGroupId) counts.set(item.productGroupId, (counts.get(item.productGroupId) ?? 0) + 1);
  return counts;
}

// 구매처 이름 필드가 따로 없으므로 제작자·공구자·링크 주소로 구매 건을 구분한다.
export function purchaseSourceLabel(item: Pick<Item, "maker" | "organizer" | "purchaseLink">) {
  const people = [item.maker, item.organizer && `공구 ${item.organizer}`].filter(Boolean).join(" · ");
  if (people) return people;
  if (item.purchaseLink) {
    try { return new URL(item.purchaseLink).hostname.replace(/^www\./, ""); } catch { return item.purchaseLink; }
  }
  return "구매처 정보 없음";
}
