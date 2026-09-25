"use client";
import { useEffect, useState } from "react";

export function OfflineStatus() {
  const [status, setStatus] = useState("기기에만 저장됩니다");
  const [waiting, setWaiting] = useState<ServiceWorker>();
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(registration => {
      const update = () => {
        if (cancelled) return;
        if (registration.waiting) setWaiting(registration.waiting);
        if (registration.active) setStatus("기기에 저장 · 오프라인 사용 준비 완료");
      };
      update();
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          update();
          if (installing.state === "redundant" && !registration.active && !cancelled) setStatus("기기에 저장 · 오프라인 준비 실패, 인터넷 연결 후 다시 열어주세요");
        });
      });
      void navigator.serviceWorker.ready.then(update);
    }).catch(() => { if (!cancelled) setStatus("기기에 저장 · 오프라인 준비 실패, 인터넷 연결 후 다시 열어주세요"); });
    return () => { cancelled = true; };
  }, []);
  return <div className="flex flex-wrap justify-between gap-2 px-4 py-2 text-xs text-neutral-500"><span>{status}</span>{waiting && <button className="underline" onClick={() => {
    if (!window.confirm("앱을 업데이트하고 다시 엽니다. 작성 중인 내용은 먼저 저장해주세요.")) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
    waiting.postMessage("activate");
  }}>새 버전으로 다시 열기</button>}</div>;
}
