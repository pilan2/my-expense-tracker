"use client";
import { useRef, useState, type ComponentProps } from "react";
import Link from "@/lib/local/navigation";
import { confirmDelivery } from "@/lib/actions/items";
import { ItemCardContent } from "./item-card";

type Props = ComponentProps<typeof ItemCardContent> & {
  id: string; href: string; className?: string; showDeliveryAction?: boolean;
};

export function ItemCardWithDelivery({ id, href, className, showDeliveryAction = true, ...item }: Props) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <div className={`min-w-0 ${className ?? ""}`}>
    <Link href={href} className="block hover:opacity-70"><ItemCardContent {...item} /></Link>
    {showDeliveryAction && !item.isPhysical && item.remainingQuantity > 0 && <div className="-mb-2 flex justify-end">
      {/* 눈에 보이는 모양은 작은 칩이지만 누르는 영역은 44px을 유지한다. */}
      <button type="button" disabled={pending} aria-label={`${item.detail} 수령 확인`}
        className="flex min-h-11 shrink-0 items-center whitespace-nowrap pl-3 text-xs font-semibold text-accent-ink disabled:opacity-50 [&>span]:rounded-full [&>span]:border [&>span]:border-accent/40 [&>span]:px-3 [&>span]:py-1"
        onClick={async () => {
          if (busy.current) return;
          busy.current = true; setPending(true); setError("");
          try { await confirmDelivery(id); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "수령 확인을 저장하지 못했습니다. 다시 시도해주세요."); }
          finally { busy.current = false; setPending(false); }
        }}><span>{pending ? "저장 중…" : "수령 확인"}</span></button>
    </div>}
    {error && <p role="alert" className="mt-2 text-sm text-loss">{error}</p>}
  </div>;
}
