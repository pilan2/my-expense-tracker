"use client";
import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { readImage } from "@/lib/local/database";
export function LocalImage({ src, alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const [loaded, setLoaded] = useState<{ id: string; url: string }>();
  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    void readImage(src).then(blob => {
      if (cancelled) return;
      url = URL.createObjectURL(blob); setLoaded({ id: src, url });
    }).catch(() => {});
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [src]);
  // 사진을 읽는 동안에도 사진과 같은 크기를 차지해야, 뒤로가기 때 복원한 스크롤 위치가 사진이 채워지며
  // 밀리지 않는다. span은 기본이 inline이라 크기 클래스가 무시되므로 block으로 둔다.
  if (loaded?.id !== src) return <span className={`block bg-surface-soft ${props.className ?? ""}`} aria-label="사진 불러오는 중" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} src={loaded.url} />;
}
