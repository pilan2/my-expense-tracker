import { writeFile } from "node:fs/promises";
import pg from "pg";

pg.types.setTypeParser(1114, value => new Date(`${value.replace(" ", "T")}Z`));
const destination = process.argv[2];
if (!destination) throw new Error("저장할 JSON 파일 경로를 인자로 지정해주세요.");
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL 또는 DATABASE_URL이 필요합니다.");
const client = new pg.Client({ connectionString });
let backup;
try {
  await client.connect();
  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const events = await client.query('SELECT * FROM "Event" ORDER BY "createdAt", "id"');
  const entries = await client.query('SELECT * FROM "EventChecklistItem" ORDER BY "createdAt", "id"');
  await client.query("COMMIT");
  backup = { format: "expense-tracker-events", schemaVersion: 1, exportedAt: new Date().toISOString(), event: events.rows, eventChecklistItem: entries.rows };
} finally { await client.end(); }
await writeFile(destination, JSON.stringify(backup, null, 2), { flag: "wx", mode: 0o600 });
console.log(`행사 내보내기 완료: 행사 ${backup.event.length}개, 체크리스트 ${backup.eventChecklistItem.length}개`);
