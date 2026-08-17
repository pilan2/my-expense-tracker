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

// shipDateApprox가 true인 품목은 expectedShipDate에 "그 달 1일"이 저장돼 있고, 정확한 날짜가
// 아니라 그 달 전체를 뜻한다. 그 달의 마지막 날짜.
export function monthLastDay(monthStart: Date): Date {
  return new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
}

// 월 단위로만 아는 예상 발송일은, 1일 기준 D-Day ~ 말일 기준 D-Day 범위로 보여준다.
export function formatDDayRange(monthStart: Date): string {
  return `${formatDDay(monthStart)} ~ ${formatDDay(monthLastDay(monthStart))}`;
}

// 월 단위 예상일은 그 달 마지막 날짜까지 지나야 "지난" 것으로 본다.
export function isShipmentOverdue(expectedShipDate: Date, approx: boolean): boolean {
  return approx ? isOverdue(monthLastDay(expectedShipDate)) : isOverdue(expectedShipDate);
}

export function formatShipDDay(expectedShipDate: Date, approx: boolean): string {
  return approx ? formatDDayRange(expectedShipDate) : formatDDay(expectedShipDate);
}

// 화면에 보여줄 발송예정일 텍스트. 월 단위면 "2026년 9월", 정확한 날짜면 "2026. 9. 15."
export function formatShipDateLabel(expectedShipDate: Date, approx: boolean): string {
  if (approx) return `${expectedShipDate.getFullYear()}년 ${expectedShipDate.getMonth() + 1}월`;
  return expectedShipDate.toLocaleDateString("ko-KR");
}
