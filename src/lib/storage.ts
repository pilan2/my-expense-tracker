import "server-only";

// Supabase Storage REST API를 직접 fetch로 호출한다(별도 SDK 없이, 업로드/삭제 2가지만 필요).
// 버킷은 Supabase 대시보드에서 "item-images"라는 이름으로 미리 public 버킷을 만들어둬야 한다.
const BUCKET = "item-images";

function requireConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("이미지 저장소가 설정되지 않았습니다. SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.");
  }
  return { url, serviceRoleKey };
}

export async function uploadItemImage(file: File): Promise<string> {
  const { url, serviceRoleKey } = requireConfig();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: await file.arrayBuffer(),
  });
  if (!res.ok) {
    throw new Error(`이미지 업로드에 실패했습니다: ${await res.text()}`);
  }

  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}

// 교체/삭제로 더 이상 쓰이지 않는 이미지를 스토리지에서도 지운다. 실패해도 품목 저장/삭제
// 자체를 막을 이유는 없으니 조용히 무시한다.
export async function deleteItemImage(imageUrl: string) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return;

  const marker = `/object/public/${BUCKET}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return;
  const path = imageUrl.slice(index + marker.length);

  await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  }).catch(() => {});
}
