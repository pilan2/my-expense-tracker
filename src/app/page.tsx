import Link from "next/link";
import { getSpendingSummary, getSalesSummary } from "@/lib/spending";
import { CategoryBreakdown } from "@/components/category-breakdown";

export default async function Home() {
  const [spending, sales] = await Promise.all([getSpendingSummary(), getSalesSummary()]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">총 소비 금액</p>
          <p className="text-3xl font-semibold">{spending.total.toLocaleString("ko-KR")}원</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">총 판매 금액</p>
          <p className="text-3xl font-semibold">{sales.total.toLocaleString("ko-KR")}원</p>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">소비 집계</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <CategoryBreakdown title="장르별" items={spending.byGenre} />
          <CategoryBreakdown title="캐릭터별" items={spending.byCharacter} />
          <CategoryBreakdown title="물품 종류별" items={spending.byItemType} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">판매 집계</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <CategoryBreakdown title="장르별" items={sales.byGenre} />
          <CategoryBreakdown title="캐릭터별" items={sales.byCharacter} />
          <CategoryBreakdown title="물품 종류별" items={sales.byItemType} />
        </div>
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
