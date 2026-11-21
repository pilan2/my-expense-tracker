import { test } from "node:test";
import assert from "node:assert/strict";
import { backupReminder } from "../src/lib/local/backup-status";

const now = new Date("2026-11-21T12:00:00Z");
const at = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

test("백업 알림: 품목이 없거나 변경이 없으면 표시하지 않는다", () => {
  assert.equal(backupReminder(undefined, 5, 0, now), null);
  assert.equal(backupReminder({ at: at(100), revision: 5 }, 5, 3, now), null);
});

test("백업 알림: 백업한 적이 없거나, 14일 이상 지났고 바뀐 내용이 있으면 표시한다", () => {
  assert.deepEqual(backupReminder(undefined, 1, 1, now), { kind: "never" });
  assert.equal(backupReminder({ at: at(13), revision: 4 }, 5, 3, now), null);
  assert.deepEqual(backupReminder({ at: at(14), revision: 4 }, 5, 3, now), { kind: "stale", days: 14 });
});
