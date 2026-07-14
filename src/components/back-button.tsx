import Link from "next/link";

export function BackButton({ href }: { href: string }) {
  return (
    <Link href={href} className="mb-4 inline-block text-sm text-neutral-500 hover:underline">
      ← 뒤로가기
    </Link>
  );
}
