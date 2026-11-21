import { test } from "node:test";
import assert from "node:assert/strict";
import { itemFilterHref, matchesItemFilter, parseItemFilter } from "../src/lib/item-filter";

const base = { genre: "장르", character: "캐릭터", series: null, itemType: "인형", detail: "겨울 키링", maker: "제작자A", organizer: null, memo: "선물용",
  isPhysical: false, expectedShipDate: new Date("2999-01-01"), shipDateApprox: false, hasOverseasShipping: false, remainingQuantity: 1 };

test("품목 검색은 띄어쓰기·대소문자를 무시하고 여러 필드를 찾는다", () => {
  assert.ok(matchesItemFilter(base, "겨울키 링", "all"));
  assert.ok(matchesItemFilter(base, "제작자a", "all"));
  assert.ok(matchesItemFilter(base, "선물", "all"));
  assert.ok(!matchesItemFilter(base, "여름", "all"));
});

test("상태 필터: 발송 대기·배송중·현물·판매 완료·배송비 미정", () => {
  const shipping = { ...base, expectedShipDate: new Date("2000-01-01") };
  assert.ok(matchesItemFilter(base, "", "waiting") && !matchesItemFilter(base, "", "shipping"));
  assert.ok(matchesItemFilter(shipping, "", "shipping") && !matchesItemFilter(shipping, "", "waiting"));
  assert.ok(matchesItemFilter({ ...base, isPhysical: true }, "", "physical"));
  const sold = { ...base, isPhysical: true, remainingQuantity: 0 };
  assert.ok(matchesItemFilter(sold, "", "sold") && !matchesItemFilter(sold, "", "physical"));
  assert.ok(!matchesItemFilter(sold, "", "all") && matchesItemFilter(base, "", "all"));
  assert.ok(matchesItemFilter({ ...base, hasOverseasShipping: true }, "", "shipping-fee") && !matchesItemFilter(base, "", "shipping-fee"));
});

test("주소 변환과 이전 배송비 미정 링크 호환", () => {
  assert.deepEqual(parseItemFilter({ pending: "1" }), { q: "", status: "shipping-fee", view: "list" });
  assert.deepEqual(parseItemFilter({ status: "모름", q: "키링", view: "grid" }), { q: "키링", status: "all", view: "grid" });
  assert.equal(itemFilterHref("", "all", "grid"), "/items?view=grid");
  assert.equal(itemFilterHref("", "all"), "/items");
  assert.equal(itemFilterHref(" 키링 ", "sold"), "/items?q=%ED%82%A4%EB%A7%81&status=sold");
});
