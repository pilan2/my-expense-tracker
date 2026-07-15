import { getMonthlyTrends, getMonthlyTrendsByGenre, getGenreComparisonTrends } from "@/lib/trends";
import { BackButton } from "@/components/back-button";
import { TrendLineChart } from "@/components/trend-chart";
import { GenreComparisonChart } from "@/components/genre-comparison-chart";

export default async function StatsPage() {
  const [overall, byGenre, comparison] = await Promise.all([
    getMonthlyTrends(),
    getMonthlyTrendsByGenre(),
    getGenreComparisonTrends(),
  ]);

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <h1 className="mb-6 text-xl font-semibold">통계</h1>

      {overall.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">구매/판매 기록이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-2 text-lg font-semibold">전체 월별 추이</h2>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <TrendLineChart points={overall} />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">장르별 구매 비교</h2>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <GenreComparisonChart months={comparison.months} series={comparison.purchase} />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">장르별 판매 비교</h2>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <GenreComparisonChart months={comparison.months} series={comparison.sale} />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">장르별 월별 추이</h2>
            <div className="flex flex-col gap-6">
              {byGenre.map((genre) => (
                <div key={genre.genre}>
                  <h3 className="mb-2 text-sm font-medium text-neutral-500">{genre.genre}</h3>
                  <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                    <TrendLineChart points={genre.points} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
