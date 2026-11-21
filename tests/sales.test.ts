import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { initializeDatabase, transaction, transactionData, currentData } from "../src/lib/local/database";
import { createRepository } from "../src/lib/local/repository";
import { updateSale } from "../src/lib/actions/sales";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("판매 수정은 같은 판매 건을 빼고 남은 수량 안에서만 저장하고, 실패하면 기존 기록을 유지한다", async () => {
  await initializeDatabase();
  const db = createRepository(transactionData, true);
  let saleId = "";
  await transaction(async () => {
    const item = db.item.create({ data: { genre: "장르", character: "캐릭터", itemType: "인형", detail: "판매 품목", quantity: 3, price: 10000 } });
    saleId = db.sale.create({ data: { itemId: item.id, quantitySold: 1, saleAmount: 15000, saleDate: null } }).id;
    db.sale.create({ data: { itemId: item.id, quantitySold: 1, saleAmount: 12000, saleDate: null } });
  });
  await assert.rejects(updateSale(saleId, form({ quantitySold: "3", saleAmount: "3", saleDate: "" })), /2개 이하/);
  assert.equal(currentData().sale.find(sale => sale.id === saleId)?.quantitySold, 1);
  await updateSale(saleId, form({ quantitySold: "2", saleAmount: "2.5", saleDate: "2026-11-05" }));
  const updated = currentData().sale.find(sale => sale.id === saleId)!;
  assert.deepEqual([updated.quantitySold, updated.saleAmount, updated.saleDate?.toISOString().slice(0, 10)], [2, 25000, "2026-11-05"]);
});
