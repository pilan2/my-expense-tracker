import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  // manifest.webmanifest/icons/apple-icon은 브라우저·OS가 로그인 없이 가져가야 하는 PWA
  // 리소스라 로그인 리다이렉트 대상에서 제외한다.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|apple-icon).*)"],
};
