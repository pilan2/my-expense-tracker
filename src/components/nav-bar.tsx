import { useContext, type ReactNode } from "react";
import Link, { LocationContext } from "@/lib/local/navigation";

type Tab = "home" | "items" | "shipments" | "events" | "more";

// 탭 첫 화면이 아닌 하위 화면도 어느 탭에 속하는지 표시하기 위한 경로 → 탭 매핑.
export function tabForPath(pathname: string): Tab {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  if (!first || first === "login") return "home";
  if (first === "items" || first === "browse") return "items";
  if (first === "shipments" || first === "shipping-groups") return "shipments";
  if (first === "events") return "events";
  return "more";
}

const icon = (path: ReactNode) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);
const tabs: { id: Tab; href: string; label: string; icon: ReactNode }[] = [
  { id: "home", href: "/", label: "홈", icon: icon(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>) },
  { id: "items", href: "/items", label: "품목", icon: icon(<><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></>) },
  { id: "shipments", href: "/shipments", label: "발송", icon: icon(<><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>) },
  { id: "events", href: "/events", label: "행사", icon: icon(<><path d="M9 5h10M9 12h10M9 19h10" /><path d="M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2" /></>) },
  { id: "more", href: "/more", label: "더보기", icon: icon(<><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>) },
];

export function NavBar() {
  const active = tabForPath(useContext(LocationContext).split("?")[0]);
  return (
    <nav aria-label="주 메뉴" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-5 px-2 pt-1.5 pb-1">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <Link href={tab.href} aria-current={active === tab.id ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${active === tab.id ? "font-bold text-accent" : "font-medium text-muted"}`}>
              <span className={`flex h-7 w-11 items-center justify-center rounded-full ${active === tab.id ? "bg-accent-soft" : ""}`}>{tab.icon}</span>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
