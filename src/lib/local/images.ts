import { stageImage } from "./database";
export async function uploadItemImage(file: Blob): Promise<string> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("JPEG, PNG, WebP, GIF 사진만 저장할 수 있습니다.");
  if (file.size > 8 * 1024 * 1024) throw new Error("사진은 8MB 이하로 선택해주세요.");
  return stageImage(file);
}
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.readAsDataURL(blob);
  });
}
