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
    {showDeliveryAction && !item.isPhysical && item.remainingQuantity > 0 && <div className="mt-2 flex justify-end">
      <button type="button" disabled={pending} aria-label={`${item.detail} 수령 확인`}
        className="min-h-11 shrink-0 whitespace-nowrap rounded-md border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 disabled:opacity-50 dark:border-blue-700 dark:text-blue-300"
        onClick={async () => {
          if (busy.current) return;
          busy.current = true; setPending(true); setError("");
          try { await confirmDelivery(id); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "수령 확인을 저장하지 못했습니다. 다시 시도해주세요."); }
          finally { busy.current = false; setPending(false); }
        }}>{pending ? "저장 중…" : "수령 확인"}</button>
    </div>}
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
  </div>;
}
