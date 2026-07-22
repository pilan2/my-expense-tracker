// 장르/캐릭터/물품종류 목록에서 순서를 위/아래로 한 칸씩 바꾸는 버튼 쌍.
// up/down은 호출 쪽에서 이미 대상 id까지 바인딩해서 넘겨준 서버 액션이라, 여기서는 그대로 폼에 꽂기만 한다.
export function MoveButtons({
  up,
  down,
  isFirst,
  isLast,
}: {
  up: () => Promise<void>;
  down: () => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      <form action={up}>
        <button
          type="submit"
          disabled={isFirst}
          aria-label="위로 이동"
          className="flex h-5 w-5 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
        >
          ▲
        </button>
      </form>
      <form action={down}>
        <button
          type="submit"
          disabled={isLast}
          aria-label="아래로 이동"
          className="flex h-5 w-5 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
        >
          ▼
        </button>
      </form>
    </div>
  );
}
