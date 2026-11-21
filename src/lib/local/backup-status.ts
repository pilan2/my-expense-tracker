import { readStateValue, writeStateValue } from "./database";

export type BackupRecord = { at: string; revision: number };
export const BACKUP_REMIND_DAYS = 14;
const KEY = "last-backup";
const EVENT = "expense-backup-recorded";

export function readLastBackup() {
  return readStateValue<BackupRecord>(KEY);
}

export async function recordBackup(revision: number, now = new Date()) {
  const record: BackupRecord = { at: now.toISOString(), revision };
  await writeStateValue(KEY, record);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
  return record;
}

export function onBackupRecorded(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export function daysSince(at: string, now = new Date()) {
  return Math.floor((now.getTime() - new Date(at).getTime()) / (24 * 60 * 60 * 1000));
}

// 기기 데이터가 유일한 사본이라 백업을 잊지 않게 알려주되, 바뀐 게 없으면 귀찮게 하지 않는다.
export function backupReminder(record: BackupRecord | undefined, revision: number, itemCount: number, now = new Date()) {
  if (itemCount === 0) return null;
  if (!record) return { kind: "never" as const };
  if (record.revision === revision) return null;
  const days = daysSince(record.at, now);
  return days >= BACKUP_REMIND_DAYS ? { kind: "stale" as const, days } : null;
}
