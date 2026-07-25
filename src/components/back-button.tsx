import Link from "next/link";

export function BackButton({ href }: { href: string }) {
  return (
    // scroll={false}: 이 이동은 브라우저 히스토리상 "뒤로"가 아니라 고정된 상위 페이지로의 새
    // 이동이라, Next가 기본으로 하는 맨 위로 스크롤을 꺼서 ScrollRestoration이 위치를 복원할 수 있게 한다.
    <Link
      href={href}
      scroll={false}
      className="mb-4 inline-block text-sm text-neutral-500 hover:underline"
    >
      ← 뒤로가기
    </Link>
  );
}
