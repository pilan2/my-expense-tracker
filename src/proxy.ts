import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  // /api/cron/*은 세션 쿠키가 없는 Vercel Cron 서버 호출이라 자체 CRON_SECRET로 인증하고,
  // manifest.webmanifest/icons/apple-icon은 브라우저·OS가 로그인 없이 가져가야 하는 PWA 리소스라
  // 둘 다 로그인 리다이렉트 대상에서 제외한다.
  matcher: [
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|apple-icon).*)",
  ],
};
