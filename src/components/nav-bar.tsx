import Link from "next/link";
import { signOut } from "@/auth";

export function NavBar({ email }: { email?: string | null }) {
  return (
    <div className="box-border flex w-full flex-wrap items-center justify-between gap-2 overflow-x-hidden border-b border-neutral-200 px-4 py-3 text-sm sm:px-6 dark:border-neutral-800">
      <Link href="/" className="font-medium hover:opacity-70">
        🏠 대시보드
      </Link>
      <div className="flex items-center gap-4">
        {email && <span className="max-w-[45vw] truncate text-neutral-500 sm:max-w-none">{email}</span>}
        <Link href="/events" className="underline">
          행사
        </Link>
        <Link href="/backup" className="underline">
          백업
        </Link>
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
