import type { ReactNode } from "react";

// 화면마다 복사해 쓰던 버튼·입력칸·카드 스타일을 한곳에서 관리한다.
// 색은 globals.css의 테마 변수만 쓰므로 다크 모드 변형을 따로 붙이지 않는다.
// 터치 영역은 최소 44px(min-h-11)로 맞춘다.
const buttonBase = "inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-40";
const buttonVariants = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-line bg-surface font-medium hover:bg-surface-soft",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "px-2 font-medium text-muted underline hover:text-foreground",
  // 같은 요소에 글자색 클래스를 두 개 붙이면 CSS 순서에 따라 결과가 달라지므로 삭제용은 따로 둔다.
  dangerGhost: "px-2 font-medium text-loss underline",
};
export function buttonClass(variant: keyof typeof buttonVariants = "primary") {
  return `${buttonBase} ${buttonVariants[variant]}`;
}

// iOS Safari는 16px 미만 입력칸에 포커스하면 화면을 확대하므로 text-base를 쓴다.
export const inputClass =
  "min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent/40";

// 이동용 텍스트 링크도 터치하기 쉽도록 높이를 확보한다.
export const linkClass = "inline-flex min-h-11 items-center text-sm text-muted underline-offset-2 hover:text-foreground hover:underline";

export const cardClass = "rounded-2xl border border-line bg-surface p-4 shadow-card";

// 금액 색 규칙: 소비는 기본 글자색, 판매는 초록, 손익은 +파랑/−빨강, 주의는 주황.
export const saleColor = "text-sale";
export const warningColor = "text-warn";
export function profitColor(value: number) {
  return value >= 0 ? "text-gain" : "text-loss";
}

// 상태는 문장 대신 색 칩으로 보여준다. 색끼리 밝기도 달라 색만으로 구분하지 않아도 된다.
const chipVariants = {
  wait: "bg-chip-wait-bg text-chip-wait-ink",
  ship: "bg-chip-ship-bg text-chip-ship-ink",
  have: "bg-chip-have-bg text-chip-have-ink",
  sold: "bg-chip-sold-bg text-chip-sold-ink",
  fee: "bg-chip-fee-bg text-chip-fee-ink",
};
export type ChipKind = keyof typeof chipVariants;
export function chipClass(kind: ChipKind) {
  return `inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${chipVariants[kind]}`;
}

export function PageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {action}
      </div>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-bold">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-muted">{children}</p>;
}
