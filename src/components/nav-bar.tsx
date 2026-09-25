import Link from "@/lib/local/navigation";
export function NavBar() {
  return <div className="box-border flex w-full flex-wrap items-center justify-between gap-2 overflow-x-hidden border-b border-neutral-200 px-4 py-3 text-sm sm:px-6 dark:border-neutral-800">
    <Link href="/" className="font-medium hover:opacity-70">🏠 대시보드</Link>
    <div className="flex items-center gap-4"><Link href="/events" className="underline">행사</Link><Link href="/backup" className="underline">백업</Link></div>
  </div>;
}
