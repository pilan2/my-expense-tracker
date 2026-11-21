import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// 오프라인에서도 같은 글꼴이 보이도록 외부 CDN 대신 앱 빌드에 포함한다.
// 한글 2,350자 등 자주 쓰는 글자만 담은 subset 파일을 써서 용량을 줄인다.
const pretendard = localFont({
  src: [
    { path: "../../node_modules/pretendard/dist/web/static/woff2-subset/Pretendard-Regular.subset.woff2", weight: "400" },
    { path: "../../node_modules/pretendard/dist/web/static/woff2-subset/Pretendard-Medium.subset.woff2", weight: "500" },
    { path: "../../node_modules/pretendard/dist/web/static/woff2-subset/Pretendard-SemiBold.subset.woff2", weight: "600" },
    { path: "../../node_modules/pretendard/dist/web/static/woff2-subset/Pretendard-Bold.subset.woff2", weight: "700" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Expense Tracker",
  description: "기기에 저장하는 개인 소비/판매 내역 관리",
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1418" },
  ],
  width: "device-width", initialScale: 1, viewportFit: "cover",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" className={`h-full antialiased ${pretendard.variable}`}><body className="min-h-full w-full overflow-x-hidden">{children}</body></html>;
}
