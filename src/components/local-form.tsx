"use client";
import { useRef, useState, type FormHTMLAttributes } from "react";
import { navigate } from "@/lib/local/navigation";
export function LocalForm({ action, onSubmit, children, ...props }: Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & { action?: string | ((data: FormData) => void | Promise<unknown>) }) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <form {...props} aria-busy={pending} onSubmit={async event => {
    onSubmit?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const data = new FormData(form);
    if (submitter?.getAttribute("formmethod") === "get" || typeof action === "string") {
      const params = new URLSearchParams(); for (const [key, value] of data) if (typeof value === "string") params.append(key, value);
      navigate(`${submitter?.getAttribute("formaction") ?? action ?? location.pathname}?${params}`); return;
    }
    busy.current = true; setPending(true); setError("");
    try { await action?.(data); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "저장하지 못했습니다. 다시 시도해주세요."); }
    finally { busy.current = false; setPending(false); }
  }}>
    {children}
    {pending && <p role="status" className="text-sm text-neutral-500">기기에 저장 중…</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </form>;
}
