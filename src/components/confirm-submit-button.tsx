"use client";

import { useRef } from "react";

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  className,
}: {
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(e) => {
          formRef.current = e.currentTarget.form;
          dialogRef.current?.showModal();
        }}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-md border border-neutral-200 bg-white p-6 text-neutral-900 backdrop:bg-black/50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <p className="mb-4 max-w-xs text-sm">{confirmMessage}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              formRef.current?.requestSubmit();
            }}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
          >
            확인
          </button>
        </div>
      </dialog>
    </>
  );
}
