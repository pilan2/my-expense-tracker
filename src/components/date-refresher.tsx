"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// 대시보드의 "이번 달" 집계, 발송 D-day 등은 서버에서 렌더링된 시점의 날짜를 기준으로 계산된다.
// 탭을 자정 너머까지 계속 켜둔 채로 두면(특히 PWA로 홈 화면에 고정해둔 경우) 새로고침 없이는
// 날짜가 안 바뀐 채로 남아있으므로, 탭이 다시 보이거나 일정 시간마다 날짜가 바뀌었는지 확인해서
// 바뀌었으면 서버 컴포넌트를 다시 불러온다.
export function DateRefresher() {
  const router = useRouter();
  const lastDateRef = useRef(todayKey());

  useEffect(() => {
    function checkDate() {
      if (document.visibilityState !== "visible") return;
      const current = todayKey();
      if (current !== lastDateRef.current) {
        lastDateRef.current = current;
        router.refresh();
      }
    }

    document.addEventListener("visibilitychange", checkDate);
    window.addEventListener("focus", checkDate);
    // 탭을 계속 켜둔 채로 자정을 넘기는 경우도 있으니 주기적으로도 확인한다.
    const interval = setInterval(checkDate, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", checkDate);
      window.removeEventListener("focus", checkDate);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
