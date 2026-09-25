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
  if (loaded?.id !== src) return <span className={props.className} aria-label="사진 불러오는 중" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} src={loaded.url} />;
}
