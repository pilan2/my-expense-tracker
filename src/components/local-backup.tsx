"use client";
import { useRef, useState } from "react";
import { BackButton } from "./back-button";
import { LocalForm } from "./local-form";
import { parseBackup, restoreParsedBackup, exportBackup, downloadJson } from "@/lib/local/backup";

export default function LocalBackup() {
  const selection = useRef(0);
  const [backup, setBackup] = useState<ReturnType<typeof parseBackup>>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reading, setReading] = useState(false);
  const [persistent, setPersistent] = useState("");
  return <div className="mx-auto max-w-xl space-y-6 p-6">
    <BackButton href="/" /><h1 className="text-xl font-semibold">백업 및 기기 저장</h1>
    <p className="text-sm text-neutral-500">데이터와 사진은 이 기기의 현재 브라우저에만 저장됩니다. 브라우저 데이터 삭제나 기기 변경에 대비해 백업 파일을 앱 밖에 보관해주세요.</p>
    <LocalForm action={async () => { downloadJson(await exportBackup()); setMessage("사진을 포함한 전체 백업을 만들었습니다. 다운로드한 파일을 보관해주세요."); }} className="rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
      <h2 className="mb-2 font-medium">전체 백업 다운로드</h2>
      <p className="mb-3 text-sm">품목, 판매, 행사, 체크리스트, 카탈로그 순서, 발송 그룹, 사진을 모두 포함합니다.</p>
      <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900">다운로드</button>
    </LocalForm>
    <LocalForm action={async () => {
      if (!backup) throw new Error("백업 파일을 선택해주세요.");
      if (!window.confirm("현재 기기의 모든 데이터를 선택한 백업으로 교체합니다. 먼저 현재 데이터를 백업했는지 확인해주세요. 계속할까요?")) return;
      await restoreParsedBackup(backup);
      setMessage("백업을 이 기기에 저장했습니다."); setBackup(undefined);
    }} className="space-y-3 rounded-md border border-red-300 p-4 dark:border-red-900">
      <h2 className="font-medium">백업 불러오기</h2>
      <p className="text-sm">선택한 파일로 현재 기기의 전체 데이터를 교체합니다. 먼저 현재 데이터를 다운로드해주세요.</p>
      <input aria-label="백업 파일" type="file" accept=".json,application/json" onChange={async event => {
        const selected = ++selection.current;
        const file = event.target.files?.[0]; setBackup(undefined); setError(""); setMessage("");
        if (!file) { setReading(false); return; }
        setReading(true);
        try {
          const parsed = parseBackup(JSON.parse(await file.text()));
          if (selected === selection.current) setBackup(parsed);
        } catch (cause) { if (selected === selection.current) setError(cause instanceof Error ? cause.message : "백업을 읽지 못했습니다."); }
        finally { if (selected === selection.current) setReading(false); }
      }} className="max-w-full text-sm" />
      {reading && <p role="status">백업 검사 중…</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {backup && <div className="text-sm"><p>품목 {backup.data.item.length}개 · 판매 {backup.data.sale.length}개 · 행사 {backup.data.event.length}개 · 사진 {backup.images.size}개</p>
        {backup.legacy && <p className="mt-2 text-amber-700 dark:text-amber-400">이전 버전의 백업입니다. 백업에 없던 행사·체크리스트·카탈로그 순서는 복원되지 않습니다. 사진은 인터넷으로 가져옵니다. 모든 정보를 보존하려면 이전 안내의 전체 내보내기를 사용해주세요.</p>}</div>}
      <button type="submit" disabled={!backup || reading} className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-40">불러오기 (기존 데이터 교체)</button>
    </LocalForm>
    {message && <p role="status" className="text-sm">{message}</p>}
    <div className="text-sm"><button className="underline" onClick={async () => {
      try { setPersistent(await navigator.storage?.persist?.() ? "브라우저의 지속 저장이 허용됐습니다. 별도 백업도 계속 보관해주세요." : "브라우저가 지속 저장을 허용하지 않았습니다. 정기적으로 백업해주세요."); }
      catch { setPersistent("지속 저장을 요청하지 못했습니다. 정기적으로 백업해주세요."); }
    }}>기기 데이터 지속 저장 요청</button><p role="status" className="mt-2">{persistent}</p></div>
  </div>;
}
