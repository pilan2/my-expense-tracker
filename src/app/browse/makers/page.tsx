import Link from "next/link";
import { getMakerSummary } from "@/lib/spending";
import { BackButton } from "@/components/back-button";
import { CategoryStatRow } from "@/components/category-stat-row";

export default async function BrowseMakersPage() {
  const makers = await getMakerSummary();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <h1 className="mb-6 text-xl font-semibold">제작자별로 보기</h1>

      {makers.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">제작한 사람이 등록된 품목이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {makers.map((maker) => (
            <li key={maker.name}>
              <Link
                href={`/browse/makers/${encodeURIComponent(maker.name)}`}
                className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
              >
                <CategoryStatRow
                  label={maker.name}
                  purchaseTotal={maker.purchaseTotal}
                  saleTotal={maker.saleTotal}
                  profit={maker.profit}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
