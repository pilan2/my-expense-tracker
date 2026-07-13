import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // 소유자 본인 이메일만 로그인 허용 (Google 콘솔의 테스트 사용자 설정과 별개의 앱 레벨 안전장치)
    signIn({ profile }) {
      return profile?.email === process.env.ALLOWED_EMAIL;
    },
  },
  pages: {
    signIn: "/login",
  },
});
