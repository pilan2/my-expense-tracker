export function formatMonth(month: string) {
  const [y, m] = month.split("-");
  return `${y.slice(2)}.${m}`;
}

export function formatWon(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}
