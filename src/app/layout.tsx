import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Expense Tracker",
  description: "기기에 저장하는 개인 소비/판매 내역 관리",
};
export const viewport: Viewport = {
  themeColor: "#0a0a0a", width: "device-width", initialScale: 1,
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" className="h-full antialiased"><body className="min-h-full w-full overflow-x-hidden">{children}</body></html>;
}
