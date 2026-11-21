import { isShipmentOverdue } from "@/lib/dday";

export const itemStatusFilters = [
  { id: "all", label: "전체" },
  { id: "waiting", label: "발송 대기" },
  { id: "shipping", label: "배송중" },
  { id: "physical", label: "현물" },
  { id: "sold", label: "판매 완료" },
  { id: "shipping-fee", label: "배송비 미정" },
] as const;
export type ItemStatusFilter = (typeof itemStatusFilters)[number]["id"];

type Filterable = {
  genre: string; character: string; series: string | null; itemType: string; detail: string;
  maker: string | null; organizer: string | null; memo: string | null;
  isPhysical: boolean; expectedShipDate: Date | null; shipDateApprox: boolean;
  hasOverseasShipping: boolean; remainingQuantity: number;
};

export type ItemView = "list" | "grid";

// 이전 "배송비 미정만 보기" 링크(?pending=1)도 같은 필터로 연다.
export function parseItemFilter(searchParams: { q?: string; status?: string; pending?: string; view?: string }) {
  const status = itemStatusFilters.some((filter) => filter.id === searchParams.status)
    ? (searchParams.status as ItemStatusFilter)
    : searchParams.pending === "1" ? "shipping-fee" : "all";
  const view: ItemView = searchParams.view === "grid" ? "grid" : "list";
  return { q: searchParams.q ?? "", status, view };
}

export function itemFilterHref(q: string, status: ItemStatusFilter, view: ItemView = "list") {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (status !== "all") params.set("status", status);
  if (view === "grid") params.set("view", "grid");
  const query = params.toString();
  return query ? `/items?${query}` : "/items";
}

// 띄어쓰기·대소문자 차이로 못 찾는 일이 없도록 비교 전에 둘 다 정규화한다.
const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

export function matchesItemFilter(item: Filterable, q: string, status: ItemStatusFilter) {
  const query = normalize(q);
  if (query) {
    const text = [item.genre, item.character, item.series, item.itemType, item.detail, item.maker, item.organizer, item.memo]
      .filter(Boolean).join(" ");
    if (!normalize(text).includes(query)) return false;
  }
  const sold = item.remainingQuantity === 0;
  const shipping = !item.isPhysical && !!item.expectedShipDate && isShipmentOverdue(item.expectedShipDate, item.shipDateApprox);
  switch (status) {
    case "waiting": return !sold && !item.isPhysical && !shipping;
    case "shipping": return !sold && shipping;
    case "physical": return !sold && item.isPhysical;
    case "sold": return sold;
    case "shipping-fee": return item.hasOverseasShipping;
    default: return true;
  }
}
