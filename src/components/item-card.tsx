
import { LocalImage } from "@/components/local-image";
import { formatShipDDay, formatShipDateLabel, isShipmentOverdue } from "@/lib/dday";
import { calcProfit } from "@/lib/profit";
import { won, signedWon } from "@/lib/money";
import { profitColor, chipClass } from "@/components/ui";
import { itemStatusChip } from "@/lib/item-status";

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
  shipDateApprox: boolean;
  imageUrl?: string | null;
  sales: { quantitySold: number; saleAmount: DecimalLike }[];
  /** 장르/캐릭터로 이미 필터된 화면(브라우즈 하위 목록)에서는 중복 표시를 줄이기 위해 숨긴다 */
  showGenreCharacter?: boolean;
  /** 같은 물품 묶음 안에서 구매 건을 구분하기 위한 구매처·구매일 */
  sourceLabel?: string;
  /** 같은 물품으로 묶인 구매 건 수(2 이상일 때만 표시) */
  sameProductCount?: number;
  /** 물품 종류(대분류)별로 묶어서 섹션 제목으로 이미 보여주는 화면에서는 중복 표시를 줄이기 위해 숨긴다 */
  showItemType?: boolean;
};

// 사진이 없는 품목도 목록이 휑하지 않도록, 장르·캐릭터마다 정해진 파스텔 색에 첫 글자를 넣는다.
const thumbTints = [
  "bg-accent-soft text-accent-ink",
  "bg-chip-wait-bg text-chip-wait-ink",
  "bg-chip-have-bg text-chip-have-ink",
  "bg-chip-ship-bg text-chip-ship-ink",
  // 노란색은 "배송비 미정" 칩과 헷갈리므로 사진 자리에는 하늘색을 쓴다.
  "bg-tint-sky-bg text-tint-sky-ink",
];
function tintFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return thumbTints[hash % thumbTints.length];
}

// "12월 굿즈"처럼 숫자로 시작하는 이름은 숫자 대신 첫 글자(한글·영문)를 쓴다.
function thumbLetter(name: string) {
  return name.match(/[\p{L}]/u)?.[0] ?? name.trim().slice(0, 1);
}

export function ItemThumb({ imageUrl, name, seed, className }: { imageUrl?: string | null; name: string; seed: string; className: string }) {
  if (imageUrl) return <LocalImage src={imageUrl} alt="" className={`${className} object-cover`} />;
  return (
    <span aria-hidden="true" className={`${className} flex items-center justify-center font-bold ${tintFor(seed)}`}>
      {thumbLetter(name)}
    </span>
  );
}

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
  shipDateApprox,
  imageUrl,
  sales,
  sourceLabel,
  sameProductCount,
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
  const status = itemStatusChip({ isPhysical, expectedShipDate, shipDateApprox, remainingQuantity });
  // 제목은 세부사항 하나만 굵게, 분류·수량 같은 보조 정보는 작은 한 줄로 모은다.
  const meta = [
    showGenreCharacter ? (genre === character ? genre : `${genre} · ${character}`) : null,
    series,
    showItemType ? itemType : null,
    remainingQuantity !== quantity && remainingQuantity > 0 ? `잔여 ${remainingQuantity}/${quantity}` : null,
    sameProductCount && sameProductCount > 1 ? `같은 물품 ${sameProductCount}건` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex items-start gap-3">
      <ItemThumb imageUrl={imageUrl} name={detail} seed={detail} className="h-14 w-14 shrink-0 rounded-xl text-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="break-words font-semibold leading-snug">{detail}</p>
          {status && <span className={chipClass(status.kind)}>{status.label}</span>}
        </div>
        {meta && <p className="text-sm text-muted">{meta}</p>}
        {sourceLabel && <p className="break-words text-sm text-muted">{sourceLabel}</p>}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold">{won(Number(price))}{quantity > 1 ? ` × ${quantity}` : ""}</span>
          {Number(shippingFee) > 0 && <span className="text-muted">배송비 {won(Number(shippingFee))}</span>}
          {hasOverseasShipping && <span className={chipClass("fee")}>배송비 미정</span>}
          {profit !== null && <span className={`font-semibold ${profitColor(profit)}`}>손익 {signedWon(profit)}</span>}
        </p>
        {/* 상태 칩만으로 부족한 날짜는 화면 읽기 프로그램용으로만 남긴다. */}
        {status && expectedShipDate && <span className="sr-only">{statusDetail(isPhysical, expectedShipDate, shipDateApprox)}</span>}
      </div>
    </div>
  );
}

function statusDetail(isPhysical: boolean, date: Date, approx: boolean) {
  if (isPhysical) return `배송 완료 (발송일 ${formatShipDateLabel(date, approx)})`;
  return isShipmentOverdue(date, approx) ? `발송일 ${formatShipDateLabel(date, approx)}` : `발송예정 ${formatShipDateLabel(date, approx)} ${formatShipDDay(date, approx)}`;
}
