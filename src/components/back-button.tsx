"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-4 text-sm text-neutral-500 hover:underline"
    >
      ← 뒤로가기
    </button>
  );
}
