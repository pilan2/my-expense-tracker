import { formatDDay, isOverdue } from "@/lib/dday";

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
  isPhysical: boolean;
  expectedShipDate: Date | null;
  /** 장르/캐릭터로 이미 필터된 화면(브라우즈 하위 목록)에서는 중복 표시를 줄이기 위해 숨긴다 */
  showGenreCharacter?: boolean;
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
  isPhysical,
  expectedShipDate,
  showGenreCharacter = true,
}: ItemCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-medium">
        {showGenreCharacter ? `${genre} · ${character}${series ? ` (${series})` : ""} · ` : ""}
        {itemType} · {detail}
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
      </p>
    </div>
  );
}
