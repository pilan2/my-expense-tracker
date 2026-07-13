function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// 자정 기준 날짜 차이로 계산해 "오늘 몇 시냐"에 영향받지 않게 한다.
export function daysUntil(expectedShipDate: Date): number {
  const today = startOfDay(new Date());
  const target = startOfDay(expectedShipDate);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDDay(expectedShipDate: Date): string {
  const diff = daysUntil(expectedShipDate);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function isOverdue(expectedShipDate: Date): boolean {
  return daysUntil(expectedShipDate) < 0;
}
