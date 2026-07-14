// 총액(원)을 weights 비율대로 나누되, 반올림 오차 없이 합계가 정확히 total이 되도록 배분한다.
// (몫은 버림으로 배분하고, 남는 원 단위는 소수부가 큰 순서대로 1원씩 추가)
export function splitProportionally(total: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight <= 0) {
    // 가중치가 전부 0인 극단적인 경우 균등 분배로 대체.
    const equal = Math.floor(total / weights.length);
    const shares = weights.map(() => equal);
    shares[0] += total - equal * weights.length;
    return shares;
  }

  const raw = weights.map((w) => (total * w) / totalWeight);
  const shares = raw.map(Math.floor);
  const remainder = total - shares.reduce((sum, s) => sum + s, 0);

  const orderByFraction = raw
    .map((r, index) => ({ index, fraction: r - Math.floor(r) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i++) {
    shares[orderByFraction[i].index] += 1;
  }

  return shares;
}
