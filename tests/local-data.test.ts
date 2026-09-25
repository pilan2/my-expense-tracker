import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRepository } from "../src/lib/local/repository";
import { emptyData, validateData } from "../src/lib/local/models";
import { initializeDatabase, transaction, transactionData, currentData, stageImage, readImage } from "../src/lib/local/database";
import { parseBackup } from "../src/lib/local/backup";

const itemInput = { genre: "장르", character: "캐릭터", itemType: "인형", detail: "테스트", quantity: 3, price: 10000 };

test("관계 조회, 필터, 날짜 정렬, 카탈로그 고유 이름과 연쇄 삭제", () => {
  const data = emptyData(), db = createRepository(() => data, true);
  const group = db.shippingGroup.create({ data: { label: "그룹" } });
  const item = db.item.create({ data: { ...itemInput, shippingGroupId: group.id, purchasedAt: new Date("2026-09-01") } });
  db.sale.create({ data: { itemId: item.id, quantitySold: 2, saleAmount: "12000" } });
  const event = db.event.create({ data: { name: "행사" } });
  db.eventChecklistItem.create({ data: { eventId: event.id, itemId: item.id, booth: "A", label: "품목", type: "PICKUP" } });
  const selected = db.item.findMany({ include: { sales: true }, where: { purchasedAt: { gte: new Date("2026-09-01"), lt: new Date("2026-10-01") } } });
  assert.equal(selected[0].sales[0].saleAmount, 12000);
  assert.equal({ ...selected[0] }.sales.length, 1);
  assert.equal(db.shippingGroup.findMany({ where: { items: { some: { isPhysical: false } } } }).length, 1);
  assert.equal(db.sale.findMany({ where: { item: { genre: "장르" } } }).length, 1);
  assert.equal(db.item.findMany({ where: { purchasedAt: { not: null }, OR: [{ maker: "없음" }, { genre: "장르" }] } }).length, 1);
  db.genre.create({ data: { name: "장르" } });
  assert.throws(() => db.genre.create({ data: { name: "장르" } }));
  validateData(data);
  db.item.delete({ where: { id: item.id } });
  assert.equal(data.sale.length, 0); assert.equal(data.eventChecklistItem.length, 0);
});

test("IndexedDB 저장 완료 후 공개, 실패 시 전체 롤백, 사진과 판매 수량 검증", async () => {
  await initializeDatabase();
  const db = createRepository(transactionData, true);
  let id = "", photo = "";
  await transaction(async () => {
    photo = stageImage(new Blob(["photo"], { type: "image/jpeg" }));
    id = db.item.create({ data: { ...itemInput, imageUrl: photo } }).id;
    assert.equal(currentData().item.length, 0);
  });
  assert.equal(currentData().item.length, 1);
  assert.equal(await (await readImage(photo)).text(), "photo");
  await assert.rejects(transaction(async () => {
    db.item.update({ where: { id }, data: { detail: "저장되면 안 됨" } });
    db.sale.create({ data: { itemId: id, quantitySold: 4, saleAmount: 10 } });
  }));
  assert.equal(currentData().item[0].detail, "테스트");
  assert.equal(currentData().sale.length, 0);
  await transaction(async () => { db.item.delete({ where: { id } }); });
  await assert.rejects(readImage(photo));
});

test("이전 백업은 날짜·금액·월 발송·판매·카탈로그를 보존하고 손상된 백업은 거절", () => {
  const data = emptyData(), db = createRepository(() => data, true);
  db.item.create({ data: { ...itemInput, shipDateApprox: true, expectedShipDate: new Date("2026-10-01") } });
  const legacy = JSON.parse(JSON.stringify({ items: data.item.map(i => ({ ...i, sales: [] })) }));
  const parsed = parseBackup(legacy);
  assert.equal(parsed.data.item[0].shipDateApprox, true);
  assert.ok(parsed.data.item[0].expectedShipDate instanceof Date);
  assert.equal(parsed.data.genre[0].name, "장르");
  assert.equal(parsed.legacy, true);
  const full = JSON.parse(JSON.stringify({ schemaVersion: 2, data: parsed.data, images: {} }));
  assert.deepEqual(parseBackup(full).data, parsed.data);
  assert.throws(() => parseBackup({ schemaVersion: 99, data }));
  assert.throws(() => parseBackup({ items: [{ ...legacy.items[0], quantity: -1 }] }));
  assert.throws(() => parseBackup({ items: [{ ...legacy.items[0], createdAt: "invalid" }] }));
  assert.throws(() => parseBackup({ schemaVersion: 2, data: {}, images: {} }));
});

test("동시에 저장해도 과판매를 막고, 저장소 트랜잭션 중단은 사진까지 롤백", async () => {
  const db = createRepository(transactionData, true);
  let id = "";
  await transaction(async () => { id = db.item.create({ data: { ...itemInput, quantity: 1 } }).id; });
  const results = await Promise.allSettled([1, 2].map(() => transaction(async () => {
    db.sale.create({ data: { itemId: id, quantitySold: 1, saleAmount: 100 } });
  })));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(currentData().sale.filter(s => s.itemId === id).length, 1);
  const originalPut = IDBObjectStore.prototype.put;
  let image = "";
  IDBObjectStore.prototype.put = function(...args: Parameters<IDBObjectStore["put"]>) {
    const request = originalPut.apply(this, args);
    if (this.name === "state") request.addEventListener("success", () => this.transaction.abort());
    return request;
  };
  try {
    await assert.rejects(transaction(async () => {
      image = stageImage(new Blob(["must roll back"], { type: "image/png" }));
      db.item.update({ where: { id }, data: { imageUrl: image, detail: "실패한 수정" } });
    }), /저장하지 못했습니다/);
    assert.equal(currentData().item.find(i => i.id === id)?.detail, "테스트");
    await assert.rejects(readImage(image));
  } finally { IDBObjectStore.prototype.put = originalPut; }
});

test("카탈로그·행사 참조 검증, 삭제 전파와 중복 이름 거절", () => {
  const data = emptyData(), db = createRepository(() => data, true);
  const g = db.genre.create({ data: { name: "g" } });
  const c = db.character.create({ data: { name: "c", genreId: g.id } });
  db.series.create({ data: { name: "s", characterId: c.id } });
  db.maker.create({ data: { name: "m", genreId: g.id } });
  db.organizer.create({ data: { name: "o", genreId: g.id } });
  db.item.create({ data: { ...itemInput, genre: "g", character: "c" } });
  validateData(data);
  db.genre.delete({ where: { id: g.id } });
  assert.equal(data.character.length + data.series.length + data.maker.length + data.organizer.length, 0);
  assert.equal(data.item[0].genre, "g");
  db.sale.create({ data: { itemId: "missing", quantitySold: 1, saleAmount: 0 } });
  assert.throws(() => validateData(data), /연결된 데이터/);
});
