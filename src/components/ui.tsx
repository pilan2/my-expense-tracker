import type { ReactNode } from "react";

// 화면마다 복사해 쓰던 버튼·입력칸·카드 스타일을 한곳에서 관리한다.
// 터치 영역은 최소 44px(min-h-11)로 맞춘다.
const buttonBase = "inline-flex min-h-11 items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40";
const buttonVariants = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300",
  secondary: "border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "px-2 text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
};
export function buttonClass(variant: keyof typeof buttonVariants = "primary") {
  return `${buttonBase} ${buttonVariants[variant]}`;
}

// iOS Safari는 16px 미만 입력칸에 포커스하면 화면을 확대하므로 text-base를 쓴다.
export const inputClass =
  "min-h-11 rounded-md border border-neutral-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900";

// 이동용 텍스트 링크도 터치하기 쉽도록 높이를 확보한다.
export const linkClass = "inline-flex min-h-11 items-center text-sm underline underline-offset-2";

export const cardClass = "rounded-lg border border-neutral-200 p-4 dark:border-neutral-800";

// 금액 색 규칙: 소비는 기본 글자색, 판매는 초록, 손익은 +파랑/−빨강, 주의는 주황.
export const saleColor = "text-green-600 dark:text-green-400";
export const warningColor = "text-amber-700 dark:text-amber-400";
export function profitColor(value: number) {
  return value >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400";
}

export function PageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        {action}
      </div>
      {description && <p className="mt-2 text-sm text-neutral-500">{description}</p>}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-neutral-500">{children}</p>;
}
