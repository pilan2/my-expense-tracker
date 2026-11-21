import Link from "@/lib/local/navigation";
import { notFound, redirect } from "@/lib/local/navigation";
import { getCategorySummary } from "@/lib/spending";
import { BackButton } from "@/components/back-button";
import { CategoryStatRow } from "@/components/category-stat-row";
import { PageHeader } from "@/components/ui";

export default  function BrowseCharactersPage({
  params,
}: {
  params: { genre: string };
}) {
  const { genre: genreParam } = params;
  const genre = decodeURIComponent(genreParam);

  // "기타" 장르는 캐릭터도 항상 "기타"라, 캐릭터 선택 단계 없이 바로 품목 목록으로.
  if (genre === "기타") {
    redirect(`/browse/${encodeURIComponent(genre)}/${encodeURIComponent(genre)}`);
  }

  const summary = getCategorySummary();
  const genreSummary = summary.genres.find((g) => g.name === genre);

  if (!genreSummary) notFound();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <PageHeader title={genre} />

      <ul className="flex flex-col gap-2">
        {genreSummary.characters.map((character) => (
          <li key={character.name}>
            <Link
              href={`/browse/${encodeURIComponent(genre)}/${encodeURIComponent(character.name)}`}
              className="block rounded-2xl border border-line bg-surface shadow-card p-3 hover:opacity-70"
            >
              <CategoryStatRow
                label={character.name}
                purchaseTotal={character.purchaseTotal}
                saleTotal={character.saleTotal}
                profit={character.profit}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
