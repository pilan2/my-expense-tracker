import { formatDDay, isOverdue } from "@/lib/dday";
import { calcProfit } from "@/lib/sales";

// Prisma Decimal도 그대로 받을 수 있도록 toString()만 요구한다.
type DecimalLike = number | string | { toString(): string };

type ItemCardProps = {
  genre: string;
  character: string;
  series: string | null;
  itemType: string;
  detail: string;
  quantity: number;
  remainingQuantity: number;
  price: DecimalLike;
  shippingFee: DecimalLike;
  hasOverseasShipping: boolean;
  isPhysical: boolean;
  expectedShipDate: Date | null;
  sales: { quantitySold: number; saleAmount: DecimalLike }[];
  /** 장르/캐릭터로 이미 필터된 화면(브라우즈 하위 목록)에서는 중복 표시를 줄이기 위해 숨긴다 */
  showGenreCharacter?: boolean;
  /** 물품 종류(대분류)별로 묶어서 섹션 제목으로 이미 보여주는 화면에서는 중복 표시를 줄이기 위해 숨긴다 */
  showItemType?: boolean;
};

export function ItemCardContent({
  genre,
  character,
  series,
  itemType,
  detail,
  quantity,
  remainingQuantity,
  price,
  shippingFee,
  hasOverseasShipping,
  isPhysical,
  expectedShipDate,
  sales,
  showGenreCharacter = true,
  showItemType = true,
}: ItemCardProps) {
  const soldQuantity = sales.reduce((sum, s) => sum + s.quantitySold, 0);
  const profit =
    soldQuantity > 0
      ? calcProfit(
          Number(price),
          Number(shippingFee),
          quantity,
          sales.map((s) => ({ quantitySold: s.quantitySold, saleAmount: Number(s.saleAmount) })),
        )
      : null;

  return (
    <div className="flex flex-col gap-1">
      <p className="font-medium">
        {showGenreCharacter ? `${genre} · ${character}${series ? ` (${series})` : ""} · ` : ""}
        {showItemType ? `${itemType} · ` : ""}
        {detail}
      </p>
      <p className="text-sm text-neutral-500">
        수량 {quantity}
        {remainingQuantity !== quantity ? ` (잔여 ${remainingQuantity})` : ""}
        {" · "}
        {Number(price).toLocaleString("ko-KR")}원
        {Number(shippingFee) > 0 ? ` (+배송비 ${Number(shippingFee).toLocaleString("ko-KR")}원)` : ""}
      </p>
      <p className="text-sm">
        {remainingQuantity === 0 ? (
          <span className="text-neutral-500">판매 완료</span>
        ) : isPhysical ? (
          <span className="text-neutral-500">현물</span>
        ) : (
          expectedShipDate && (
            <>
              <span className="text-neutral-500">
                발송예정 {expectedShipDate.toLocaleDateString("ko-KR")}{" "}
              </span>
              <span className={`font-medium ${isOverdue(expectedShipDate) ? "text-red-600" : "text-blue-600"}`}>
                {formatDDay(expectedShipDate)}
              </span>
            </>
          )
        )}
        {hasOverseasShipping && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            배송비 미정
          </span>
        )}
      </p>
      {profit !== null && (
        <p className={`text-sm font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
          손익 {profit >= 0 ? "+" : ""}
          {profit.toLocaleString("ko-KR")}원
        </p>
      )}
    </div>
  );
}
