import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";

// Prisma의 timestamp without time zone은 UTC로 저장된다. 내보내는 PC 시간대로 재해석하지 않는다.
pg.types.setTypeParser(1114, value => new Date(`${value.replace(" ", "T")}Z`));

const destination = process.argv[2];
if (!destination) throw new Error("저장할 JSON 파일 경로를 인자로 지정해주세요.");
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL 또는 DATABASE_URL이 필요합니다.");
const client = new pg.Client({ connectionString });
const names = ["Item", "Sale", "Genre", "Character", "Series", "ItemType", "Maker", "Organizer", "ShippingGroup", "Event", "EventChecklistItem"];
const data = {};
try {
  await client.connect();
  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  for (const name of names) {
    const { rows } = await client.query(`SELECT * FROM "${name}" ORDER BY "createdAt", "id"`);
    data[name[0].toLowerCase() + name.slice(1)] = rows;
  }
  await client.query("COMMIT");
} finally { await client.end(); }

const images = {};
for (const item of data.item) {
  if (!item.imageUrl) continue;
  if (!/^https:\/\//i.test(item.imageUrl)) throw new Error("지원하지 않는 사진 주소가 있습니다. 백업을 중단합니다.");
  const response = await fetch(item.imageUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`품목 ${item.id}의 사진을 읽지 못했습니다. 백업을 중단합니다.`);
  const blob = await response.blob();
  if (!/^image\/(jpeg|png|webp|gif)$/.test(blob.type) || blob.size > 8 * 1024 * 1024) throw new Error(`품목 ${item.id}의 사진 형식 또는 크기를 확인해주세요.`);
  const id = `local-image:${randomUUID()}`;
  images[id] = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
  item.imageUrl = id;
}
// 기존 파일은 덮어쓰지 않으며 백업 파일을 다른 OS 사용자에게 공개하지 않는다.
await writeFile(destination, JSON.stringify({ schemaVersion: 2, exportedAt: new Date().toISOString(), data, images }, null, 2), { flag: "wx", mode: 0o600 });
console.log(`백업 완료: 품목 ${data.item.length}개, 판매 ${data.sale.length}개, 행사 ${data.event.length}개, 사진 ${Object.keys(images).length}개`);
