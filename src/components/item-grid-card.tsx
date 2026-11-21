import Link from "@/lib/local/navigation";
import { ItemThumb } from "@/components/item-card";
import { itemStatusChip } from "@/lib/item-status";
import { won } from "@/lib/money";
import { chipClass } from "@/components/ui";

type GridItem = {
  id: string; detail: string; series: string | null; itemType: string; imageUrl?: string | null;
  price: number | string | { toString(): string }; quantity: number; remainingQuantity: number;
  isPhysical: boolean; expectedShipDate: Date | null; shipDateApprox: boolean;
};

// 사진 그리드 한 칸. 같은 물품 묶음이면 badge로 구매 건수를 보여준다.
export function ItemGridCard({ item, href, badge, total }: { item: GridItem; href: string; badge?: string; total?: number }) {
  const status = itemStatusChip(item);
  return (
    <Link href={href} className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card hover:opacity-80">
      <span className="relative block">
        <ItemThumb imageUrl={item.imageUrl} name={item.detail} seed={item.detail} className="aspect-square w-full text-3xl" />
        {status && <span className={`absolute top-2 left-2 ${chipClass(status.kind)}`}>{status.label}</span>}
        {badge && <span className="absolute top-2 right-2 rounded-full bg-surface/90 px-2 py-0.5 text-xs font-bold">{badge}</span>}
      </span>
      <span className="flex flex-col gap-0.5 px-3 pt-2 pb-3">
        <span className="truncate text-sm font-semibold">{item.detail}</span>
        <span className="truncate text-xs text-muted">{[item.series, item.itemType].filter(Boolean).join(" · ")}</span>
        <span className="mt-0.5 text-sm font-semibold">{won(total ?? Number(item.price) * item.quantity)}</span>
      </span>
    </Link>
  );
}
