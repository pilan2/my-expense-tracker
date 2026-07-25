import "server-only";
import { prisma } from "@/lib/prisma";

// 대시보드/이벤트 목록에서 쓰는 요약. 날짜 있는 행사는 최신순, 날짜 없는 건 등록순으로 뒤에.
export function getEvents() {
  return prisma.event.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      entries: {
        select: {
          id: true,
          checked: true,
          price: true,
          quantity: true,
          type: true,
          item: { select: { price: true, quantity: true } },
        },
      },
    },
  });
}

export function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: [{ booth: "asc" }, { createdAt: "asc" }],
        include: {
          item: {
            select: { id: true, genre: true, character: true, detail: true, price: true, quantity: true },
          },
        },
      },
    },
  });
}

type MoneyLike = number | string | { toString(): string };

// 품목과 연결된 체크리스트 항목은 등록 당시 스냅샷(entry.price/quantity)이 아니라, 그 품목의
// 최신 가격/수량을 그대로 따른다(품목을 나중에 수정하면 체크리스트 금액도 같이 바뀌도록).
// 품목이 삭제된 경우(onDelete: SetNull로 item이 null이 됨)에만 등록 당시 스냅샷을 그대로 쓴다.
export function effectiveChecklistAmount(entry: {
  price: MoneyLike;
  quantity: number;
  item: { price: MoneyLike; quantity: number } | null;
}): number {
  const price = entry.item ? Number(entry.item.price) : Number(entry.price);
  const quantity = entry.item ? entry.item.quantity : entry.quantity;
  return price * quantity;
}

// 품목 연결 선택지를 위한 전체 품목 간단 목록 (최신순).
export function getItemOptions() {
  return prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, genre: true, character: true, detail: true, price: true, quantity: true },
  });
}
