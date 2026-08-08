"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// 다음 자정(+5초 여유)까지 남은 밀리초.
function msUntilNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  return nextMidnight.getTime() - now.getTime();
}

// 대시보드의 "이번 달" 집계, 발송 D-day 등은 서버에서 렌더링된 시점의 날짜를 기준으로 계산된다.
// 탭을 자정 너머까지 계속 켜둔 채로 두면 새로고침 없이는 날짜가 안 바뀐 채로 남아있으므로,
// 다음 자정 시점에 딱 한 번 확인하도록 예약해두고(계속 폴링하지 않음), 혹시 그 타이밍에
// 탭이 백그라운드라 못 걸렸을 경우를 대비해 다시 화면을 보거나 포커스를 얻을 때도 확인한다.
export function DateRefresher() {
  const router = useRouter();
  const lastDateRef = useRef(todayKey());

  useEffect(() => {
    function check() {
      const current = todayKey();
      if (current !== lastDateRef.current) {
        lastDateRef.current = current;
        router.refresh();
      }
    }

    function checkIfVisible() {
      if (document.visibilityState === "visible") check();
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    function scheduleMidnightCheck() {
      timeoutId = setTimeout(() => {
        checkIfVisible();
        scheduleMidnightCheck();
      }, msUntilNextMidnight());
    }
    scheduleMidnightCheck();

    document.addEventListener("visibilitychange", checkIfVisible);
    window.addEventListener("focus", checkIfVisible);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", checkIfVisible);
      window.removeEventListener("focus", checkIfVisible);
    };
  }, [router]);

  return null;
}
