import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { initializeDatabase, transaction, transactionData, currentData, stageItemDraftRemoval } from "../src/lib/local/database";
import { createRepository } from "../src/lib/local/repository";
import { itemDraftKey, readItemDraft, writeItemDraft, queueItemDraftWrite, type ItemDraftValues } from "../src/lib/local/item-draft";
import { exportBackup } from "../src/lib/local/backup";

const values: ItemDraftValues = {
  genre: "입력 중인 장르", character: "", series: "", itemType: "", detail: "아직 작성 중인 설명\n다음 줄",
  quantity: 2, price: "", purchasedAt: "", shippingFee: "0", hasOverseasShipping: true,
  maker: "", organizer: "", isPhysical: false, expectedShipDate: "", expectedShipMonth: "2030-10",
  shipDateApprox: true, purchaseLink: "https://example.com", memo: "완성 전 메모",
};

test("미완성 입력·사진 보존, 순서 보장, 다른 탭 충돌과 후보별 분리", async () => {
  await initializeDatabase();
  const key = itemDraftKey();
  assert.deepEqual(await readItemDraft(key), { revision: 0, values: null, image: null });
  const image = new Blob(["photo"], { type: "image/jpeg" });
  let revision = await writeItemDraft(key, 0, values, image);
  const first = queueItemDraftWrite(key, async () => { revision = await writeItemDraft(key, revision, { ...values, memo: "수정 1" }); });
  const second = queueItemDraftWrite(key, async () => { revision = await writeItemDraft(key, revision, { ...values, memo: "수정 2" }); });
  const restored = await readItemDraft(key);
  await Promise.all([first, second]);
  assert.equal(restored.values?.memo, "수정 2");
  assert.equal(restored.values?.purchasedAt, "");
  assert.equal(await restored.image?.text(), "photo");
  await assert.rejects(writeItemDraft(key, 1, values), /다른 탭/);
  await writeItemDraft(itemDraftKey("wish-1"), 0, { ...values, detail: "후보 1" });
  assert.equal((await readItemDraft(itemDraftKey("wish-1"))).values?.detail, "후보 1");
  assert.equal((await readItemDraft(key)).values?.detail, values.detail);
  const backup = await exportBackup();
  assert.equal(backup.data.item.length, 0);
  assert.deepEqual(backup.images, {});
});

test("등록 실패 시 임시저장 유지, 성공 시 품목과 함께 원자적으로 삭제", async () => {
  const key = itemDraftKey(), initial = await readItemDraft(key);
  const input = { genre: "장르", character: "캐릭터", itemType: "인형", detail: "완성한 품목", price: 10000 };
  const db = createRepository(transactionData, true);
  await assert.rejects(transaction(async () => {
    db.item.create({ data: input });
    stageItemDraftRemoval(key, initial.revision - 1);
  }), /임시저장/);
  assert.equal(currentData().item.length, 0);
  assert.equal((await readItemDraft(key)).values?.memo, "수정 2");
  assert.equal(await (await readItemDraft(key)).image?.text(), "photo");
  await transaction(async () => {
    db.item.create({ data: input }); stageItemDraftRemoval(key, initial.revision);
  });
  assert.equal(currentData().item.length, 1);
  assert.deepEqual(await readItemDraft(key), { revision: initial.revision + 1, values: null, image: null });
  await assert.rejects(writeItemDraft(key, initial.revision, values), /다른 탭/);
  assert.ok((await readItemDraft(itemDraftKey("wish-1"))).values);
});

test("새로 작성은 해당 임시 사진만 지우고 오래된 탭의 재생성을 막는다", async () => {
  const key = itemDraftKey("wish-1"), before = await readItemDraft(key);
  await writeItemDraft(key, before.revision, null);
  assert.equal((await readItemDraft(key)).values, null);
  await assert.rejects(writeItemDraft(key, before.revision, values), /다른 탭/);
  assert.equal(currentData().item.length, 1);
});
