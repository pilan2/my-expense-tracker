import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyData } from "../src/lib/local/models";
import { createRepository } from "../src/lib/local/repository";
import { initializeDatabase, transaction, replaceData, stageImage, currentData, readImage, transactionData } from "../src/lib/local/database";
import { parseEventBackup, recoverEvents } from "../src/lib/local/event-backup";

function setup() {
  const data = emptyData(), db = createRepository(() => data, true);
  db.item.create({ data: { id: "item-1", genre: "장르", character: "캐릭터", itemType: "인형", detail: "기기에서 수정한 품목", quantity: 3, price: 10000, imageUrl: "local-image:photo-1" } });
  db.sale.create({ data: { itemId: "item-1", quantitySold: 1, saleAmount: 12000 } });
  db.event.create({ data: { id: "local-event", name: "휴대폰의 행사" } });
  const cloud = emptyData(), source = createRepository(() => cloud, true);
  source.event.create({ data: { id: "cloud-event", name: "복구할 행사" } });
  source.eventChecklistItem.create({ data: { id: "entry-1", eventId: "cloud-event", itemId: "item-1", booth: "A", label: "수령", type: "PICKUP", checked: false } });
  return { data, file: { format: "expense-tracker-events", schemaVersion: 1, event: cloud.event, eventChecklistItem: cloud.eventChecklistItem } };
}

test("행사 복구는 품목·판매·사진·기존 행사를 보존하고 재실행 시 체크 상태를 덮어쓰지 않는다", async () => {
  await initializeDatabase();
  const { data, file } = setup();
  const photo = new Blob(["photo"], { type: "image/png" });
  await transaction(async () => { replaceData(data); stageImage(photo, "local-image:photo-1"); });
  const before = structuredClone(currentData());
  const backup = parseEventBackup(JSON.parse(JSON.stringify(file)));
  assert.deepEqual(await recoverEvents(backup), { events: 1, entries: 1, skipped: 0 });
  for (const table of ["item", "sale", "genre", "character", "series", "itemType", "maker", "organizer", "shippingGroup"] as const) assert.deepEqual(currentData()[table], before[table]);
  assert.deepEqual(currentData().event[0], before.event[0]);
  assert.equal(await (await readImage("local-image:photo-1")).text(), "photo");
  await transaction(async () => {
    transactionData().eventChecklistItem[0].checked = true;
  });
  const edited = structuredClone(currentData());
  assert.deepEqual(await recoverEvents(backup), { events: 0, entries: 0, skipped: 1 });
  assert.deepEqual(currentData(), edited);
});

test("품목 누락·ID 충돌 시 전체 변경을 취소하고 손상된 파일을 거절한다", async () => {
  const { file } = setup();
  const missing = structuredClone(file);
  missing.event[0].id = "new-event";
  missing.eventChecklistItem[0].eventId = "new-event";
  missing.eventChecklistItem[0].itemId = "missing-item";
  const before = structuredClone(currentData());
  await assert.rejects(recoverEvents(parseEventBackup(missing)), /연결된 품목/);
  assert.deepEqual(currentData(), before);
  missing.eventChecklistItem[0].itemId = "item-1";
  await assert.rejects(recoverEvents(parseEventBackup(missing)), /중복된 ID/);
  assert.deepEqual(currentData(), before);
  assert.throws(() => parseEventBackup({ schemaVersion: 2, data: {} }), /행사 전용/);
  assert.throws(() => parseEventBackup({ ...file, event: [...file.event, ...file.event] }), /중복된 ID/);
  assert.throws(() => parseEventBackup({ ...file, event: [] }), /연결된 데이터/);
});
