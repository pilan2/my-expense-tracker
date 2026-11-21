import type { ItemView } from "@/lib/item-filter";

const KEY = "item-view";

// 목록/사진 그리드 선택은 이 기기의 화면 설정이라 데이터(백업)와 별도로 브라우저에 기억한다.
// 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 기억 없이 목록 보기로 동작한다.
export function readItemView(): ItemView | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "grid" || value === "list" ? value : null;
  } catch {
    return null;
  }
}

export function saveItemView(view: ItemView) {
  try { localStorage.setItem(KEY, view); } catch { /* 기억하지 못해도 이번 화면에는 적용된다. */ }
}
