"use client";

import { useState } from "react";

export function EditGroupLabelForm({
  currentLabel,
  action,
}: {
  currentLabel: string;
  action: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm text-neutral-500 hover:underline"
      >
        수정
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        action(formData);
        setEditing(false);
      }}
      className="flex flex-wrap items-center gap-1"
    >
      <input
        name="label"
        defaultValue={currentLabel}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-40 rounded border border-neutral-300 px-1.5 py-0.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button type="submit" className="text-xs underline">
        저장
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-neutral-400 hover:underline"
      >
        취소
      </button>
    </form>
  );
}
