import Link from "@/lib/local/navigation";
import { PageHeader } from "@/components/ui";

const groups: { title: string; links: { href: string; label: string; description: string }[] }[] = [
  {
    title: "기록 보기",
    links: [
      { href: "/stats", label: "통계", description: "월별 추이와 장르별 비교" },
      { href: "/purchases", label: "구매 내역", description: "구매일 순 전체 목록" },
      { href: "/sales", label: "판매 내역", description: "판매일 순 전체 목록과 손익" },
    ],
  },
  {
    title: "관리",
    links: [
      { href: "/budget", label: "월별 예산", description: "이번 달 예산과 남은 금액" },
      { href: "/catalog", label: "장르/캐릭터 관리", description: "선택지 추가·이름 변경·순서" },
      { href: "/shipping-groups", label: "발송 그룹", description: "함께 발송되는 품목 묶음" },
      { href: "/backup", label: "백업 및 기기 저장", description: "전체 백업 다운로드·불러오기" },
    ],
  },
];

export default function MorePage() {
  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <PageHeader title="더보기" />
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-2 text-sm font-medium text-neutral-500">{group.title}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-surface-soft">
                    <span className="flex flex-col">
                      <span className="font-medium">{link.label}</span>
                      <span className="text-sm text-neutral-500">{link.description}</span>
                    </span>
                    <span aria-hidden="true" className="text-neutral-400">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
