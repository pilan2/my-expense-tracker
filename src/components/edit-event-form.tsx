"use client";

import { LocalForm } from "@/components/local-form";

import { useState } from "react";
import { buttonClass } from "@/components/ui";

export function EditEventForm({
  currentName,
  currentDate,
  action,
}: {
  currentName: string;
  currentDate: string;
  action: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={buttonClass("ghost")}
      >
        수정
      </button>
    );
  }

  return (
    <LocalForm
      action={async (formData) => {
        await action(formData);
        setEditing(false);
      }}
      className="flex flex-wrap items-center gap-1"
    >
      <input
        name="name"
        defaultValue={currentName}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-28 rounded border border-neutral-300 px-1.5 py-0.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        name="date"
        type="date"
        defaultValue={currentDate}
        className="rounded border border-neutral-300 px-1.5 py-0.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button type="submit" className={buttonClass("ghost")}>
        저장
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className={buttonClass("ghost")}
      >
        취소
      </button>
    </LocalForm>
  );
}
