import Link from "next/link";
import { getSpendingSummary } from "@/lib/spending";
import { CategoryBreakdown } from "@/components/category-breakdown";

export default async function Home() {
  const summary = await getSpendingSummary();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <p className="text-sm text-neutral-500">총 소비 금액</p>
        <p className="text-3xl font-semibold">{summary.total.toLocaleString("ko-KR")}원</p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <CategoryBreakdown title="장르별" items={summary.byGenre} />
        <CategoryBreakdown title="캐릭터별" items={summary.byCharacter} />
        <CategoryBreakdown title="물품 종류별" items={summary.byItemType} />
      </div>

      <Link
        href="/items"
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        품목 목록 보기
      </Link>
    </div>
  );
}
