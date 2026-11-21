import Link from "@/lib/local/navigation";
import { getMakerSummary } from "@/lib/spending";
import { BackButton } from "@/components/back-button";
import { CategoryStatRow } from "@/components/category-stat-row";
import { EmptyState, PageHeader } from "@/components/ui";

export default  function BrowseMakersPage() {
  const makers = getMakerSummary();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <PageHeader title="제작자별로 보기" />

      {makers.length === 0 ? (
        <EmptyState>제작한 사람이 등록된 품목이 없습니다.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {makers.map((maker) => (
            <li key={maker.name}>
              <Link
                href={`/browse/makers/${encodeURIComponent(maker.name)}`}
                className="block rounded-2xl border border-line bg-surface shadow-card p-3 hover:opacity-70"
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
