import { test } from "node:test";
import assert from "node:assert/strict";
import { orderPurchases, purchaseTitle, memoSnippet } from "../src/lib/product-groups";

test("같은 물품 구매 건은 구매처가 없어도 구매 순서 번호로 구분한다", () => {
  const rows = [
    { id: "late", purchasedAt: new Date("2026-11-19"), createdAt: new Date("2026-11-19") },
    { id: "unknown", purchasedAt: null, createdAt: new Date("2026-01-01") },
    { id: "early", purchasedAt: new Date("2026-10-22"), createdAt: new Date("2026-10-22") },
  ];
  assert.deepEqual(orderPurchases(rows).map(row => row.id), ["early", "late", "unknown"]);
  assert.equal(purchaseTitle(1, { maker: null, organizer: null, purchaseLink: null }), "1번째 구매");
  assert.equal(purchaseTitle(2, { maker: null, organizer: "공구자", purchaseLink: null }), "2번째 구매 · 공구 공구자");
  assert.equal(purchaseTitle(3, { maker: null, organizer: null, purchaseLink: "https://www.shop.com/a" }), "3번째 구매 · shop.com");
  assert.equal(memoSnippet("첫 줄 메모\n둘째 줄"), "첫 줄 메모");
  assert.equal(memoSnippet("   "), null);
});

test("발송 그룹 기준: 구매일과 관계없이 같은 발송일, 발송일을 모르면 같은 날 + 같은 판매자", async () => {
  const { isSameShipment } = await import("../src/lib/shipping-group-matching");
  const day = new Date("2026-11-01"), ship = new Date("2026-12-10");
  const base = { id: "a", purchasedAt: day, maker: null, organizer: null, isPhysical: false, expectedShipDate: ship, shipDateApprox: false, shippingGroupId: null };
  assert.ok(isSameShipment(base, { ...base, id: "b" }));
  assert.ok(!isSameShipment(base, { ...base, id: "b", expectedShipDate: new Date("2026-12-11") }));
  assert.ok(isSameShipment({ ...base, maker: "작가" }, { ...base, id: "b", maker: "작가", expectedShipDate: null }));
  assert.ok(!isSameShipment({ ...base, maker: "작가A" }, { ...base, id: "b", maker: "작가B" }));
  assert.ok(isSameShipment({ ...base, maker: "작가A" }, { ...base, id: "b" }));
  assert.ok(isSameShipment(base, { ...base, id: "b", purchasedAt: new Date("2026-11-20") }));
  assert.ok(!isSameShipment({ ...base, expectedShipDate: null }, { ...base, id: "b", expectedShipDate: null }));
  assert.ok(!isSameShipment({ ...base, maker: "작가", expectedShipDate: null }, { ...base, id: "b", maker: "작가", expectedShipDate: null, purchasedAt: new Date("2026-11-02") }));
  assert.ok(!isSameShipment(base, { ...base, id: "b", shipDateApprox: true }));
});
