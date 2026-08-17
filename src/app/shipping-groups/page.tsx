import Link from "next/link";
import { getShippingGroups } from "@/lib/shipping-groups";
import { backfillShippingGroups } from "@/lib/actions/shipping-groups";
import { formatShipDateLabel } from "@/lib/dday";
import { BackButton } from "@/components/back-button";

function summarizeGroupDate(
  items: { isPhysical: boolean; expectedShipDate: Date | null; shipDateApprox: boolean }[],
) {
  const pending = items.filter((i) => !i.isPhysical && i.expectedShipDate);
  if (pending.length === 0) return "발송예정일 미정";

  const first = pending[0];
  const allSame = pending.every(
    (i) =>
      i.expectedShipDate!.getTime() === first.expectedShipDate!.getTime() && i.shipDateApprox === first.shipDateApprox,
  );
  if (allSame) return `발송예정 ${formatShipDateLabel(first.expectedShipDate!, first.shipDateApprox)}`;
  return "품목마다 발송예정일이 다름";
}

export default async function ShippingGroupsPage() {
  const groups = await getShippingGroups();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/shipments" />
      <h1 className="mb-2 text-xl font-semibold">발송 그룹</h1>
      <p className="mb-4 text-sm text-neutral-500">
        같은 날 구매하고 제작자/공구자가 같은 품목은 자동으로 묶여요. 발송일이 밀리면 그룹
        전체를 한 번에 수정할 수 있어요.
      </p>

      <form action={backfillShippingGroups} className="mb-6">
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:opacity-70 dark:border-neutral-700"
        >
          자동 그룹화 다시 실행
        </button>
        <p className="mt-1 text-xs text-neutral-500">
          이 기능이 생기기 전에 등록한 품목처럼, 아직 그룹에 안 들어간 품목을 다시 검사해서 묶어요.
        </p>
      </form>

      {groups.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">아직 발송 그룹이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => {
            const pendingCount = group.items.filter((i) => !i.isPhysical).length;
            return (
              <li key={group.id}>
                <Link
                  href={`/shipping-groups/${group.id}`}
                  className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
                >
                  <p className="font-medium">{group.label}</p>
                  <p className="text-sm text-neutral-500">
                    {summarizeGroupDate(group.items)} · 발송 대기 {pendingCount}개
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
