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
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium">{label}</span>
      <div className="text-right text-sm text-neutral-500">
        <p>
          구매 {purchaseTotal.toLocaleString("ko-KR")}원 · 판매 {saleTotal.toLocaleString("ko-KR")}원
        </p>
        {saleTotal > 0 && (
          <p className={`font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
            손익 {profit >= 0 ? "+" : ""}
            {profit.toLocaleString("ko-KR")}원
          </p>
        )}
      </div>
    </div>
  );
}
