"use client";
import { useRef, useState } from "react";
import { currentData } from "@/lib/local/database";
import { parseEventBackup, planEventRecovery, recoverEvents } from "@/lib/local/event-backup";
import { LocalForm } from "./local-form";

export function EventRecovery() {
  const selection = useRef(0);
  const [backup, setBackup] = useState<ReturnType<typeof parseEventBackup>>();
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  let preview: ReturnType<typeof planEventRecovery> | undefined;
  let previewError = "";
  if (backup) {
    try { preview = planEventRecovery(currentData(), backup); }
    catch (cause) { previewError = cause instanceof Error ? cause.message : "행사 파일을 확인해주세요."; }
  }
  return <LocalForm action={async () => {
    if (!backup) throw new Error("행사 복구 파일을 선택해주세요.");
    if (!window.confirm("기존 기록을 유지하면서 이 기기에 없는 행사와 체크리스트를 추가합니다. 계속할까요?")) return;
    const result = await recoverEvents(backup);
    setMessage(`행사 ${result.events}개 · 체크리스트 ${result.entries}개를 추가했습니다. 기존 행사 ${result.skipped}개는 유지했습니다.`);
    setBackup(undefined);
  }} className="space-y-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
    <h2 className="font-medium">누락된 행사만 복구</h2>
    <p className="text-sm">클라우드에서 내보낸 행사 전용 파일을 선택하세요. 품목·판매·사진과 기존 행사는 유지하고, 아직 없는 행사와 체크리스트만 추가합니다. 먼저 현재 기기의 전체 백업을 다운로드해주세요.</p>
    <input aria-label="행사 복구 파일" type="file" accept=".json,application/json" className="max-w-full text-sm" onChange={async event => {
      const selected = ++selection.current;
      const file = event.target.files?.[0];
      setBackup(undefined); setError(""); setMessage(""); setReading(Boolean(file));
      if (!file) return;
      try {
        const parsed = parseEventBackup(JSON.parse(await file.text()));
        if (selected === selection.current) setBackup(parsed);
      } catch (cause) {
        if (selected === selection.current) setError(cause instanceof Error ? cause.message : "행사 파일을 읽지 못했습니다.");
      } finally { if (selected === selection.current) setReading(false); }
    }} />
    {reading && <p role="status">행사 파일 검사 중…</p>}
    {(error || previewError) && <p role="alert" className="text-sm text-red-600">{error || previewError}</p>}
    {preview && <p className="text-sm">추가할 행사 {preview.event.length}개 · 체크리스트 {preview.eventChecklistItem.length}개 · 이미 있는 행사 {preview.skipped}개</p>}
    <button type="submit" disabled={reading || !preview?.event.length} className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900">행사만 추가</button>
    {message && <p role="status" className="text-sm">{message}</p>}
  </LocalForm>;
}
