"use client";
import { useEffect, useState } from "react";

export function OfflineStatus() {
  // 정상일 때는 아무것도 보이지 않고, 오프라인 준비 실패나 새 버전이 있을 때만 알린다.
  const [status, setStatus] = useState("");
  const [waiting, setWaiting] = useState<ServiceWorker>();
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(registration => {
      const update = () => {
        if (cancelled) return;
        if (registration.waiting) setWaiting(registration.waiting);
        if (registration.active) setStatus("");
      };
      update();
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          update();
          if (installing.state === "redundant" && !registration.active && !cancelled) setStatus("오프라인 사용 준비에 실패했어요. 인터넷에 연결한 뒤 다시 열어주세요.");
        });
      });
      void navigator.serviceWorker.ready.then(update);
    }).catch(() => { if (!cancelled) setStatus("오프라인 사용 준비에 실패했어요. 인터넷에 연결한 뒤 다시 열어주세요."); });
    return () => { cancelled = true; };
  }, []);
  if (!status && !waiting) return null;
  return <div role="status" className="flex flex-wrap items-center justify-between gap-2 bg-accent-soft px-4 py-1 text-sm text-accent-ink"><span>{status || "새 버전이 준비됐어요."}</span>{waiting && <button className="min-h-11 font-semibold underline" onClick={() => {
    if (!window.confirm("앱을 업데이트하고 다시 엽니다. 작성 중인 내용은 먼저 저장해주세요.")) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
    waiting.postMessage("activate");
  }}>새 버전으로 다시 열기</button>}</div>;
}
