"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// 뒤로가기가 브라우저 히스토리가 아니라 고정된 상위 페이지 링크로 이동하는 방식이라(nav.ts 참고),
// 브라우저가 원래 해주는 스크롤 위치 복원이 동작하지 않는다. 그래서 페이지별로 스크롤 위치를
// sessionStorage에 직접 기억해뒀다가, 같은 URL로 돌아오면 복원한다.
export function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `scroll:${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    const target = saved ? Number(saved) : 0;

    let cancelled = false;
    let frame: number;
    let restoring = true;
    // 링크를 눌러 다른 페이지로 이동을 "시작"한 순간부터는, 그 뒤에 들어오는 scroll 이벤트를
    // 전부 무시한다. Next가 새 페이지로 DOM을 바꿔치기하는 과정에서 스크롤이 순간적으로
    // 0(또는 다른 값)으로 튀면서 "scroll" 이벤트가 한 번 더 발생하는데, 그걸 이 페이지의
    // 저장 리스너가 그대로 받아버리면 방금 눌렀을 때의 정확한 위치가 그 튄 값으로 덮어써진다.
    let leaving = false;
    const start = performance.now();

    function save(source: string) {
      if (restoring) return;
      if (leaving && source === "scroll") return;
      sessionStorage.setItem(key, String(window.scrollY));
    }

    function tryScroll() {
      if (cancelled) return;
      window.scrollTo(0, target);
      const reached = Math.abs(window.scrollY - target) < 2;
      const timedOut = performance.now() - start > 2000;
      if (reached || timedOut) {
        restoring = false;
        return;
      }
      frame = requestAnimationFrame(tryScroll);
    }
    frame = requestAnimationFrame(tryScroll);

    const onScroll = () => save("scroll");
    window.addEventListener("scroll", onScroll, { passive: true });

    // 클릭이 링크(또는 링크 안의 요소)를 향한 것일 때만 "이동 시작"으로 보고, 그 시점의
    // 스크롤 위치를 확정 저장한 뒤 이후 scroll 이벤트를 무시한다. pointerdown은 스크롤
    // 제스처의 시작에도 걸리므로(모바일 터치 스크롤) 이걸로는 판단하지 않는다.
    function onClickCapture(e: MouseEvent) {
      const clickTarget = e.target;
      const anchor = clickTarget instanceof Element ? clickTarget.closest("a[href]") : null;
      if (!anchor) return;
      leaving = true;
      save("click-anchor");
    }
    document.addEventListener("click", onClickCapture, { capture: true });

    return () => {
      cancelled = true;
      restoring = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClickCapture, { capture: true });
    };
  }, [key]);

  return null;
}
