"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/local/navigation";
import { currentData, currentRevision } from "@/lib/local/database";
import { backupReminder, daysSince, onBackupRecorded, readLastBackup, type BackupRecord } from "@/lib/local/backup-status";
import { warningColor } from "@/components/ui";

function useLastBackup() {
  const [state, setState] = useState<{ loaded: boolean; record?: BackupRecord }>({ loaded: false });
  useEffect(() => {
    let cancelled = false;
    const load = () => { void readLastBackup().then(record => { if (!cancelled) setState({ loaded: true, record }); }).catch(() => {}); };
    load();
    const off = onBackupRecorded(load);
    return () => { cancelled = true; off(); };
  }, []);
  return state;
}

// 홈 상단 알림. 백업이 필요할 때만 보인다.
export function BackupReminder() {
  const { loaded, record } = useLastBackup();
  if (!loaded) return null;
  const reminder = backupReminder(record, currentRevision(), currentData().item.length);
  if (!reminder) return null;
  return (
    <Link href="/backup" role="status" className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-chip-fee-bg px-4 py-3 text-sm">
      <span className={warningColor}>
        {reminder.kind === "never"
          ? "아직 백업한 적이 없어요. 기록이 이 기기에만 있으니 백업 파일을 보관해주세요."
          : `마지막 백업 후 ${reminder.days}일이 지났고 바뀐 내용이 있어요.`}
      </span>
      <span className="shrink-0 font-medium underline">백업하기 →</span>
    </Link>
  );
}

type StorageInfo = { usage?: number; quota?: number; persisted?: boolean };

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)}MB`;

// 백업 화면의 현재 상태 요약: 마지막 백업, 저장 공간, 지속 저장 여부.
export function BackupStatusSummary({ persistedChanged }: { persistedChanged: number }) {
  const { loaded, record } = useLastBackup();
  const [storage, setStorage] = useState<StorageInfo>({});
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const estimate = await navigator.storage?.estimate?.();
        const persisted = await navigator.storage?.persisted?.();
        if (!cancelled) setStorage({ usage: estimate?.usage, quota: estimate?.quota, persisted });
      } catch { /* 지원하지 않는 브라우저는 표시하지 않는다. */ }
    })();
    return () => { cancelled = true; };
  }, [persistedChanged]);
  const changed = record && record.revision !== currentRevision();
  return (
    <ul aria-label="백업 상태" className="space-y-1 rounded-md bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
      <li>
        마지막 백업:{" "}
        {!loaded ? "확인 중…" : record
          ? `${new Date(record.at).toLocaleDateString("ko-KR")} (${daysSince(record.at) === 0 ? "오늘" : `${daysSince(record.at)}일 전`})${changed ? " · 이후 바뀐 내용 있음" : " · 이후 변경 없음"}`
          : "아직 없음"}
      </li>
      {storage.usage !== undefined && (
        <li>사용 중인 기기 저장 공간: {mb(storage.usage)}{storage.quota ? ` / 사용 가능 ${mb(storage.quota)}` : ""}</li>
      )}
      {storage.persisted !== undefined && (
        <li>지속 저장: {storage.persisted ? "허용됨 (브라우저가 공간 부족 시에도 지우지 않음)" : "허용 안 됨 (공간이 부족하면 브라우저가 지울 수 있음)"}</li>
      )}
    </ul>
  );
}
