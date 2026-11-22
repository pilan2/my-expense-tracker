import { test } from "node:test";
import assert from "node:assert/strict";
import { largestInscribedSize } from "../src/lib/image-crop";

// 회전 뒤 남기는 직사각형의 네 모서리를 원래 각도로 되돌렸을 때 모두 원본 사진 안에 있어야 한다.
function insideOriginal(width: number, height: number, rotation: number) {
  const { width: w, height: h } = largestInscribedSize(width, height, rotation);
  const rad = (-rotation * Math.PI) / 180;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([sx, sy]) => {
    const x = (sx * w) / 2, y = (sy * h) / 2;
    const ox = x * Math.cos(rad) - y * Math.sin(rad), oy = x * Math.sin(rad) + y * Math.cos(rad);
    return Math.abs(ox) <= width / 2 + 1e-6 && Math.abs(oy) <= height / 2 + 1e-6;
  });
}

test("회전 후 자르기 영역은 사진 안쪽 직사각형으로만 남는다", () => {
  for (const [width, height] of [[4000, 3000], [3000, 4000], [1000, 1000], [1200, 300]]) {
    for (const rotation of [-180, -135, -90, -45, -30, -7, 0, 1, 15, 33, 60, 89, 90, 120, 179, 180]) {
      assert.ok(insideOriginal(width, height, rotation), `${width}x${height} ${rotation}도`);
      const size = largestInscribedSize(width, height, rotation);
      assert.ok(size.width > 0 && size.height > 0);
    }
  }
  assert.deepEqual(largestInscribedSize(4000, 3000, 90), { width: 3000, height: 4000 });
  assert.deepEqual(largestInscribedSize(4000, 3000, -180), { width: 4000, height: 3000 });
  // 살짝만 돌리면 거의 원래 크기가 남는다.
  assert.ok(largestInscribedSize(4000, 3000, 1).width > 3900);
});
