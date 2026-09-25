import { emptyData, normalizeRow, tables, validateData, type Data, type Table } from "./models";
import { createRepository } from "./repository";
import { readBackupSnapshot, replaceData, stageImage, transaction } from "./database";
import { blobToDataUrl } from "./images";

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("백업 파일 형식이 올바르지 않습니다.");
  return value as JsonObject;
}
function rows(data: JsonObject, table: string): unknown[] {
  if (!Array.isArray(data[table])) throw new Error(`백업에 ${table} 목록이 없습니다.`);
  return data[table];
}

export function parseBackup(input: unknown): { data: Data; images: Map<string, string>; legacy: boolean } {
  const root = object(input), data = emptyData(), images = new Map<string, string>();
  const legacy = root.schemaVersion === undefined && Array.isArray(root.items);
  function setRows<K extends Table>(table: K, values: unknown[]) { data[table] = values.map(row => normalizeRow(table, row)) as Data[K]; }
  if (legacy) {
    for (const value of rows(root, "items")) {
      const item = object(value);
      const imageId = item.imageUrl ? `local-image:${crypto.randomUUID()}` : null;
      if (imageId) images.set(imageId, String(item.imageUrl));
      data.item.push(normalizeRow("item", { series: null, shippingFee: 0, maker: null, organizer: null, purchasedAt: null, expectedShipDate: null, purchaseLink: null, memo: null, shipDateApprox: false, shippingGroupId: null, ...item, imageUrl: imageId }));
      if (!Array.isArray(item.sales)) throw new Error("기존 백업에 판매 이력이 누락되어 있습니다.");
      for (const sale of item.sales) data.sale.push(normalizeRow("sale", { ...object(sale), itemId: item.id }));
    }
    const db = createRepository(() => data, true);
    for (const item of data.item) {
      if (item.shippingGroupId && !data.shippingGroup.some(g => g.id === item.shippingGroupId)) db.shippingGroup.create({ data: { id: item.shippingGroupId, label: `${item.maker ?? item.organizer ?? "이전"} 발송 그룹` } });
      const genre = db.genre.upsert({ where: { name: item.genre }, create: { name: item.genre }, update: {} });
      const character = db.character.upsert({ where: { genreId: genre.id, name: item.character }, create: { genreId: genre.id, name: item.character }, update: {} });
      db.itemType.upsert({ where: { name: item.itemType }, create: { name: item.itemType }, update: {} });
      if (item.series) db.series.upsert({ where: { characterId: character.id, name: item.series }, create: { characterId: character.id, name: item.series }, update: {} });
      for (const table of ["maker", "organizer"] as const) if (item[table]) db[table].upsert({ where: { genreId: genre.id, name: item[table] }, create: { genreId: genre.id, name: item[table] }, update: {} });
    }
  } else {
    if (root.schemaVersion !== 2) throw new Error("지원하지 않는 백업 버전입니다.");
    const source = object(root.data);
    for (const table of tables) setRows(table, rows(source, table));
    for (const [id, value] of Object.entries(object(root.images))) {
      if (!/^local-image:[a-zA-Z0-9-]+$/.test(id) || typeof value !== "string" || !/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(value)) throw new Error("백업 사진 형식이 올바르지 않습니다.");
      images.set(id, value);
    }
  }
  validateData(data);
  for (const item of data.item) if (item.imageUrl && !images.has(item.imageUrl)) throw new Error("백업에서 품목 사진이 누락되었습니다.");
  return { data, images, legacy };
}

export async function restoreParsedBackup(backup: ReturnType<typeof parseBackup>) {
  const photos = new Map<string, Blob>();
  const referenced = new Set(backup.data.item.map(item => item.imageUrl));
  for (const [id, source] of backup.images) {
    if (!referenced.has(id)) continue;
    if (!source.startsWith("data:") && !/^https:\/\//i.test(source)) throw new Error("기존 사진 주소가 올바르지 않습니다.");
    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try { response = await fetch(source, { credentials: "omit", referrerPolicy: "no-referrer", signal: controller.signal }); }
    catch { throw new Error("기존 사진을 가져오지 못했습니다. 인터넷 연결과 사진 주소를 확인해주세요. 기존 데이터는 유지됩니다."); }
    finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error("기존 사진을 가져오지 못했습니다. 기존 데이터는 유지됩니다.");
    const blob = await response.blob();
    if (!/^image\/(jpeg|png|webp|gif)$/.test(blob.type) || blob.size > 8 * 1024 * 1024) throw new Error("지원하지 않는 사진 형식이거나 사진이 8MB를 초과합니다.");
    photos.set(id, blob);
  }
  await transaction(async () => {
    replaceData(structuredClone(backup.data));
    for (const [id, blob] of photos) stageImage(blob, id);
  });
}

export async function exportBackup() {
  const { data, images: blobs } = await readBackupSnapshot();
  const images: Record<string, string> = {};
  for (const [id, blob] of blobs) images[id] = await blobToDataUrl(blob);
  return { schemaVersion: 2, exportedAt: new Date().toISOString(), data, images };
}

export function downloadJson(value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
