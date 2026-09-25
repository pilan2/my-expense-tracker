"use client";
import { createContext, useContext, type AnchorHTMLAttributes } from "react";
import { notifyChange } from "./database";
export const LocationContext = createContext("/");
export function navigate(href: string, replace = false) {
  const url = new URL(href, location.origin);
  if (url.origin !== location.origin || !["http:", "https:"].includes(url.protocol)) throw new Error("앱 내부 주소만 이동할 수 있습니다.");
  window.history[replace ? "replaceState" : "pushState"](null, "", url.pathname + url.search + url.hash);
  window.dispatchEvent(new Event("expense-navigation"));
}
const router = { push: (href: string) => navigate(href), replace: (href: string) => navigate(href, true), refresh: notifyChange, back: () => history.back() };
export function useRouter() { return router; }
export function usePathname() { return useContext(LocationContext).split("?")[0]; }
export function useSearchParams() { return new URLSearchParams(useContext(LocationContext).split("?")[1] ?? ""); }
export class Redirect extends Error { constructor(public href: string) { super(href); } }
export class NotFound extends Error { constructor() { super("항목을 찾을 수 없습니다."); } }
export function redirect(href: string): never { throw new Redirect(href); }
export function notFound(): never { throw new NotFound(); }
export default function Link({ href, onClick, scroll, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; scroll?: boolean }) {
  void scroll;
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || props.target || props.download) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    event.preventDefault(); navigate(href);
  }} />;
}
