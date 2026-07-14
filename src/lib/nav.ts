// 품목 상세로 이동할 때, 저장/삭제 후 원래 있던 화면으로 돌아올 수 있도록 출처를 함께 넘긴다.
export function itemHref(id: string, from: string): string {
  return `/items/${id}?from=${encodeURIComponent(from)}`;
}

// 서버 액션이 리다이렉트할 때, 상대 경로가 아니면(엉뚱한 값이 들어오면) 안전하게 기본값으로.
export function safeRedirectTarget(from: string, fallback = "/items"): string {
  return from.startsWith("/") ? from : fallback;
}
