import Link from "next/link";
import { getCategorySummary } from "@/lib/spending";
import { BackButton } from "@/components/back-button";
import { CategoryStatRow } from "@/components/category-stat-row";

export default async function BrowseGenresPage() {
  const summary = await getCategorySummary();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton />
      <h1 className="mb-6 text-xl font-semibold">장르별로 보기</h1>

      {summary.genres.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">등록된 품목이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {summary.genres.map((genre) => (
            <li key={genre.name}>
              <Link
                href={`/browse/${encodeURIComponent(genre.name)}`}
                className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
              >
                <CategoryStatRow
                  label={genre.name}
                  purchaseTotal={genre.purchaseTotal}
                  saleTotal={genre.saleTotal}
                  profit={genre.profit}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
