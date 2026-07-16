"use client";

import { useActionState, useState } from "react";
import type { RenameState } from "@/lib/actions/catalog";

// 이름을 눌러서 수정 모드로 바꾸면, 저장 시 서버 액션이 카탈로그 항목뿐 아니라
// 그 이름을 쓰던 품목들도 함께 바꿔준다. 이름 충돌 등 에러는 throw 대신 상태값으로
// 돌아오므로(useActionState) 프로덕션에서도 실제 에러 메시지가 그대로 보인다.
// 수정 폼은 절대 위치로 띄워서, 좁은 pill 모양 chip 안에서 내용이 넘치지 않게 한다.
export function EditableName({
  name,
  action,
  inputClassName,
}: {
  name: string;
  action: (prevState: RenameState, formData: FormData) => Promise<RenameState>;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(action, {});

  // 액션 결과가 바뀐 순간(=제출이 끝난 순간) 렌더 중에 바로 반영한다(useEffect 대신
  // 렌더 중 상태 조정 패턴 — https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (!state.error) setEditing(false);
  }

  return (
    <span className="relative inline-flex items-center gap-1.5">
      {name}
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        aria-label={`"${name}" 이름 수정`}
      >
        ✎
      </button>

      {editing && (
        <form
          action={formAction}
          className="absolute top-full left-0 z-20 mt-1 flex w-max max-w-[calc(100vw-3rem)] flex-col gap-1 rounded-md border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-1">
            <input
              name="name"
              defaultValue={name}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
              }}
              className={
                inputClassName ??
                "w-28 rounded border border-neutral-300 px-1.5 py-0.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              }
            />
            <button type="submit" disabled={isPending} className="text-xs underline">
              저장
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-neutral-400 hover:underline"
            >
              취소
            </button>
          </div>
          {state.error && <p className="max-w-[220px] text-xs text-red-600">{state.error}</p>}
        </form>
      )}
    </span>
  );
}
