import type { CategoryTotal } from "@/lib/spending";

export function CategoryBreakdown({ title, items }: { title: string; items: CategoryTotal[] }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-neutral-500">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-400">데이터 없음</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.name} className="flex items-center justify-between text-sm">
              <span>{item.name}</span>
              <span className="font-medium">{item.total.toLocaleString("ko-KR")}원</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
