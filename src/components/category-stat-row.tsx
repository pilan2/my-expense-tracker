import { won, signedWon } from "@/lib/money";
import { profitColor } from "@/components/ui";
export function CategoryStatRow({
  label,
  purchaseTotal,
  saleTotal,
  profit,
}: {
  label: string;
  purchaseTotal: number;
  saleTotal: number;
  profit: number;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium">{label}</span>
      <div className="text-sm text-neutral-500 sm:text-right">
        <p>
          구매 {won(purchaseTotal)} · 판매 {won(saleTotal)}
        </p>
        {saleTotal > 0 && (
          <p className={`font-medium ${profitColor(profit)}`}>
            손익 {signedWon(profit)}
          </p>
        )}
      </div>
    </div>
  );
}
