import { formatShipDDay, isShipmentOverdue } from "@/lib/dday";

type StatusInput = {
  isPhysical: boolean; expectedShipDate: Date | null; shipDateApprox: boolean; remainingQuantity: number;
};

// 카드·상세에 붙이는 상태 칩 한 개. 날짜 같은 자세한 내용은 상세 화면에서 보여준다.
export function itemStatusChip(item: StatusInput): { kind: "wait" | "ship" | "have" | "sold"; label: string } | null {
  if (item.remainingQuantity === 0) return { kind: "sold", label: "판매 완료" };
  if (item.isPhysical) return { kind: "have", label: "현물" };
  if (!item.expectedShipDate) return null;
  if (isShipmentOverdue(item.expectedShipDate, item.shipDateApprox)) return { kind: "ship", label: "배송중" };
  return {
    kind: "wait",
    // 월 단위 발송일은 "D-3 ~ D-33"처럼 길어지므로 칩에는 "12월 중"으로 줄여 쓰고, 올해가 아니면 연도를 붙인다.
    label: item.shipDateApprox ? monthLabel(item.expectedShipDate) : formatShipDDay(item.expectedShipDate, false),
  };
}

function monthLabel(date: Date, now = new Date()) {
  const month = date.getMonth() + 1;
  return date.getFullYear() === now.getFullYear() ? `${month}월 중` : `${date.getFullYear()}년 ${month}월`;
}
