"use client";

import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { initializeDatabase, refreshDatabase, subscribe, getVersion } from "@/lib/local/database";
import { LocationContext, navigate, Redirect, NotFound } from "@/lib/local/navigation";
import { NavBar } from "./nav-bar";
import { ScrollRestoration } from "./scroll-restoration";
import { DateRefresher } from "./date-refresher";
import { OfflineStatus } from "./offline-status";
import Home from "@/views/page";
import Items from "@/views/items/page";
import Item from "@/views/items/[id]/page";
import NewItem from "@/views/items/new/page";
import BulkSale from "@/views/items/bulk-sale/page";
import Catalog from "@/views/catalog/page";
import Stats from "@/views/stats/page";
import Shipments from "@/views/shipments/page";
import Groups from "@/views/shipping-groups/page";
import Group from "@/views/shipping-groups/[id]/page";
import Events from "@/views/events/page";
import Event from "@/views/events/[id]/page";
import Purchases from "@/views/purchases/page";
import Sales from "@/views/sales/page";
import Genres from "@/views/browse/[genre]/page";
import Characters from "@/views/browse/[genre]/[character]/page";
import Makers from "@/views/browse/makers/page";
import Maker from "@/views/browse/makers/[maker]/page";
import Backup from "./local-backup";

function Route({ url }: { url: string }) {
  const [pathname, search = ""] = url.split("?");
  const segments = pathname.split("/").filter(Boolean);
  const query = new URLSearchParams(search);
  const searchParams = Object.fromEntries([...query.keys()].map(key => [key, query.get(key) ?? ""]));
  if (!segments.length || pathname === "/login") return <Home />;
  switch (segments[0]) {
    case "items":
      if (segments.length === 1) return <Items searchParams={searchParams} />;
      if (segments.length !== 2) break;
      if (segments[1] === "new") return <NewItem />;
      if (segments[1] === "bulk-sale") return <BulkSale searchParams={{ itemIds: query.getAll("itemIds") }} />;
      return <Item params={{ id: decodeURIComponent(segments[1]) }} searchParams={searchParams} />;
    case "events":
      if (segments.length === 1) return <Events />;
      if (segments.length === 2) return <Event params={{ id: decodeURIComponent(segments[1]) }} />;
      break;
    case "shipping-groups":
      if (segments.length === 1) return <Groups />;
      if (segments.length === 2) return <Group params={{ id: decodeURIComponent(segments[1]) }} />;
      break;
    case "browse":
      if (segments[1] === "makers") {
        if (segments.length === 2) return <Makers />;
        if (segments.length === 3) return <Maker params={{ maker: segments[2] }} />;
      }
      if (segments.length === 2) return <Genres params={{ genre: segments[1] }} />;
      if (segments.length === 3) return <Characters params={{ genre: segments[1], character: segments[2] }} />;
      break;
  }
  if (segments.length === 1) {
    switch (segments[0]) {
      case "catalog": return <Catalog />;
      case "stats": return <Stats searchParams={searchParams} />;
      case "shipments": return <Shipments searchParams={searchParams} />;
      case "purchases": return <Purchases />;
      case "sales": return <Sales />;
      case "backup": return <Backup />;
    }
  }
  return <p className="p-6">페이지를 찾을 수 없습니다.</p>;
}

class PageBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { if (error instanceof Redirect) navigate(error.href, true); }
  render() {
    const error = this.state.error;
    if (!error) return this.props.children;
    if (error instanceof Redirect) return null;
    return <div role="alert" className="p-6"><p>{error instanceof NotFound ? "항목을 찾을 수 없습니다." : error.message}</p><button className="mt-3 underline" onClick={() => navigate("/")}>대시보드로</button></div>;
  }
}

export default function LocalApp() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("/");
  useSyncExternalStore(subscribe, getVersion, () => 0);
  useEffect(() => {
    let cancelled = false;
    const updateUrl = () => setUrl(location.pathname + location.search);
    updateUrl();
    void initializeDatabase().then(() => { if (!cancelled) setReady(true); }).catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : "기기 저장소를 열지 못했습니다."); });
    const refresh = () => { if (document.visibilityState === "visible") void refreshDatabase().catch(cause => setError(cause instanceof Error ? cause.message : "기기 저장소를 읽지 못했습니다.")); };
    window.addEventListener("popstate", updateUrl);
    window.addEventListener("expense-navigation", updateUrl);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { cancelled = true; window.removeEventListener("popstate", updateUrl); window.removeEventListener("expense-navigation", updateUrl); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  if (error) return <div role="alert" className="p-6"><p>{error}</p><p>브라우저의 사이트 데이터 저장 설정을 확인해주세요.</p><button className="mt-3 underline" onClick={() => location.reload()}>다시 시도</button></div>;
  if (!ready) return <p role="status" className="p-6">기기 데이터를 불러오는 중…</p>;
  return <LocationContext value={url}>
    <NavBar /><OfflineStatus /><DateRefresher />
    <PageBoundary key={url}><Route url={url} /></PageBoundary>
    <ScrollRestoration />
  </LocationContext>;
}
