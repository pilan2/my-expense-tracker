import "server-only";
import { prisma } from "@/lib/prisma";

// 대시보드/이벤트 목록에서 쓰는 요약. 날짜 있는 행사는 최신순, 날짜 없는 건 등록순으로 뒤에.
export function getEvents() {
  return prisma.event.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { entries: { select: { id: true, checked: true, price: true, quantity: true, type: true } } },
  });
}

export function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: [{ booth: "asc" }, { createdAt: "asc" }],
        include: { item: { select: { id: true, genre: true, character: true, detail: true } } },
      },
    },
  });
}

// 품목 연결 선택지를 위한 전체 품목 간단 목록 (최신순).
export function getItemOptions() {
  return prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, genre: true, character: true, detail: true, price: true, quantity: true },
  });
}
