import Link from "next/link";
import { signOut } from "@/auth";

export function NavBar({ email }: { email?: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 text-sm dark:border-neutral-800">
      <Link href="/" className="font-medium hover:opacity-70">
        🏠 대시보드
      </Link>
      <div className="flex items-center gap-4">
        {email && <span className="text-neutral-500">{email}</span>}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="underline">
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
