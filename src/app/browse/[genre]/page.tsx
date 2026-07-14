import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCategorySummary } from "@/lib/spending";
import { BackButton } from "@/components/back-button";
import { CategoryStatRow } from "@/components/category-stat-row";

export default async function BrowseCharactersPage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre: genreParam } = await params;
  const genre = decodeURIComponent(genreParam);

  // "기타" 장르는 캐릭터도 항상 "기타"라, 캐릭터 선택 단계 없이 바로 품목 목록으로.
  if (genre === "기타") {
    redirect(`/browse/${encodeURIComponent(genre)}/${encodeURIComponent(genre)}`);
  }

  const summary = await getCategorySummary();
  const genreSummary = summary.genres.find((g) => g.name === genre);

  if (!genreSummary) notFound();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <BackButton />
      <h1 className="mb-6 text-xl font-semibold">{genre}</h1>

      <ul className="flex flex-col gap-2">
        {genreSummary.characters.map((character) => (
          <li key={character.name}>
            <Link
              href={`/browse/${encodeURIComponent(genre)}/${encodeURIComponent(character.name)}`}
              className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
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
