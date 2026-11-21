import { redirect } from "@/lib/local/navigation";

// 예전 캐릭터별 화면 주소는 장르 화면의 캐릭터 필터로 보낸다.
export default function BrowseCharacterRedirect({ params }: { params: { genre: string; character: string } }) {
  const genre = decodeURIComponent(params.genre);
  const character = decodeURIComponent(params.character);
  return redirect(`/browse/${encodeURIComponent(genre)}?character=${encodeURIComponent(character)}`);
}
