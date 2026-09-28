import { emptyData, normalizeRow, validateData, type Data } from "./models";
import { transaction, transactionData } from "./database";

type EventBackup = Pick<Data, "event" | "eventChecklistItem">;

export function parseEventBackup(input: unknown): EventBackup {
  if (!input || typeof input !== "object") throw new Error("행사 복구 파일 형식이 올바르지 않습니다.");
  const root = input as Record<string, unknown>;
  if (root.format !== "expense-tracker-events" || root.schemaVersion !== 1 || !Array.isArray(root.event) || !Array.isArray(root.eventChecklistItem)) {
    throw new Error("행사 전용 내보내기로 만든 파일을 선택해주세요.");
  }
  const backup = {
    event: root.event.map(row => normalizeRow("event", row)),
    eventChecklistItem: root.eventChecklistItem.map(row => normalizeRow("eventChecklistItem", row)),
  };
  // 파일 내부의 행사 참조와 중복을 먼저 검사하고, 품목 참조는 기기 데이터와 비교한다.
  validateData({ ...emptyData(), ...backup, eventChecklistItem: backup.eventChecklistItem.map(row => ({ ...row, itemId: null })) });
  return backup;
}

export function planEventRecovery(data: Data, backup: EventBackup) {
  const existing = new Set(data.event.map(row => row.id));
  const event = backup.event.filter(row => !existing.has(row.id));
  const added = new Set(event.map(row => row.id));
  const eventChecklistItem = backup.eventChecklistItem.filter(row => added.has(row.eventId));
  const items = new Set(data.item.map(row => row.id));
  const missing = eventChecklistItem.filter(row => row.itemId !== null && !items.has(row.itemId));
  if (missing.length) throw new Error(`체크리스트 ${missing.length}개에 연결된 품목이 이 기기에 없습니다. 아무 데이터도 변경하지 않았습니다. 품목 연결을 확인한 후 다시 복구해주세요.`);
  validateData({ ...data, event: [...data.event, ...event], eventChecklistItem: [...data.eventChecklistItem, ...eventChecklistItem] });
  return { event, eventChecklistItem, skipped: backup.event.length - event.length };
}

export async function recoverEvents(backup: EventBackup) {
  return transaction(async () => {
    const data = transactionData();
    const plan = planEventRecovery(data, backup);
    data.event.push(...structuredClone(plan.event));
    data.eventChecklistItem.push(...structuredClone(plan.eventChecklistItem));
    return { events: plan.event.length, entries: plan.eventChecklistItem.length, skipped: plan.skipped };
  });
}
