const WON_PER_MANWON = 10000;

// 입력 폼은 만원 단위(예: "1.5")를 받고, DB에는 원 단위 정수로 저장한다.
// 부동소수점 곱셈의 오차(2.54 * 10000 = 25399.999999999996 등)를 Math.round로 보정한다.
export function manwonToWon(manwon: string): string {
  return String(Math.round(Number(manwon) * WON_PER_MANWON));
}

export function wonToManwon(won: number | string): string {
  return (Number(won) / WON_PER_MANWON).toString();
}
