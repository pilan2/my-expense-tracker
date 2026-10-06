import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyData, validateData, type Data } from "../src/lib/local/models";
import { createRepository } from "../src/lib/local/repository";
import { budgetAmount, monthBudget, wishCost } from "../src/lib/budget";
import { parseBackup, exportBackup, restoreParsedBackup } from "../src/lib/local/backup";
import { initializeDatabase, currentData, transaction, transactionData, readBackupSnapshot } from "../src/lib/local/database";

function fixture() {
  const data = emptyData(), db = createRepository(() => data, true);
  db.item.create({ data: { id: "item-1", genre: "장르", character: "캐릭터", itemType: "인형", detail: "구매", price: 20000, quantity: 2, shippingFee: 3000, purchasedAt: new Date("2026-10-01"), hasOverseasShipping: true } });
  db.item.create({ data: { genre: "장르", character: "캐릭터", itemType: "인형", detail: "날짜 모름", price: 9000 } });
  db.sale.create({ data: { itemId: "item-1", quantitySold: 1, saleAmount: 50000, saleDate: new Date("2026-10-03") } });
  db.event.create({ data: { id: "event-1", name: "행사" } });
  db.eventChecklistItem.create({ data: { eventId: "event-1", itemId: "item-1", label: "수령", booth: "A", type: "PICKUP", price: 40000 } });
  db.budgetRule.create({ data: { id: "2026-10", amount: 100000 } });
  db.budgetRule.create({ data: { id: "2026-11", amount: 200000 } });
  db.monthlyBudget.create({ data: { id: "2026-12", amount: 0 } });
  db.wish.create({ data: { title: "구매 후보", month: "2026-10", price: 30000, quantity: 2, shippingFee: 1000, priority: 1, status: "pending" } });
  return data;
}

test("월별 예산은 과거 설정·별도 0원 예산을 보존하고 판매·행사·후보를 중복 합산하지 않는다", () => {
  const data = fixture();
  assert.equal(budgetAmount(data, "2026-09"), null);
  assert.equal(budgetAmount(data, "2026-10"), 100000);
  assert.equal(budgetAmount(data, "2026-11"), 200000);
  assert.equal(budgetAmount(data, "2026-12"), 0);
  assert.equal(budgetAmount(data, "2027-01"), 200000);
  assert.deepEqual(monthBudget(data, "2026-10"), { amount: 100000, spent: 43000, remaining: 57000, undated: 1, pendingShipping: 1 });
  assert.equal(monthBudget(data, "2026-10", "item-1").spent, 0);
  assert.equal(wishCost(data.wish[0]), 61000);
  data.item[0].purchasedAt = new Date("2026-11-01");
  assert.equal(monthBudget(data, "2026-10").spent, 0);
  assert.equal(monthBudget(data, "2026-11").spent, 43000);
  assert.throws(() => budgetAmount(data, "2026-13"), /월/);
});

test("이전 저장본 자동 보완과 버전 2·3 백업 호환, 누락된 새 테이블 거절", async () => {
  const previous = fixture();
  const old = structuredClone(previous) as Partial<Data>;
  delete old.budgetRule; delete old.monthlyBudget; delete old.wish;
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("my-expense-tracker", 1);
    request.onupgradeneeded = () => { request.result.createObjectStore("state"); request.result.createObjectStore("images"); };
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite"); tx.objectStore("state").put({ revision: 4, data: old }, "data");
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
  });
  db.close();
  await initializeDatabase();
  assert.deepEqual(currentData().item, previous.item);
  assert.deepEqual(currentData().eventChecklistItem, previous.eventChecklistItem);
  assert.deepEqual(currentData().budgetRule, []);
  assert.deepEqual((await readBackupSnapshot()).data.wish, []);
  const v2 = parseBackup({ schemaVersion: 2, data: old, images: {} });
  assert.deepEqual(v2.data.wish, []);
  const v3 = parseBackup(JSON.parse(JSON.stringify({ schemaVersion: 3, data: previous, images: {} })));
  await restoreParsedBackup(v3);
  const exported = await exportBackup();
  assert.equal(exported.schemaVersion, 3);
  assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(exported))).data, previous);
  for (const table of ["budgetRule", "monthlyBudget", "wish"] as const) {
    const broken = structuredClone(exported) as { schemaVersion: number; data: Partial<Data>; images: object };
    delete broken.data[table];
    assert.throws(() => parseBackup(broken), /목록이 없습니다/);
  }
  const before = structuredClone(currentData());
  await assert.rejects(transaction(async () => { transactionData().wish[0].priority = 4; }), /우선순위/);
  assert.deepEqual(currentData(), before);
});

test("구매 완료 후보는 연결 품목을 삭제해도 다시 구매 대기 상태가 되지 않는다", () => {
  const data = fixture(), db = createRepository(() => data, true);
  data.wish[0].status = "purchased"; data.wish[0].itemId = "item-1";
  db.item.delete({ where: { id: "item-1" } });
  assert.equal(data.wish[0].status, "purchased"); assert.equal(data.wish[0].itemId, null);
  validateData(data);
});
