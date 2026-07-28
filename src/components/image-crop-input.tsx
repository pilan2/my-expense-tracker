"use client";

import { useRef, useState } from "react";
import ReactCrop, { centerCrop, type Crop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { rotateImage, cropImageByPercent } from "@/lib/image-crop";

type Stage = "closed" | "rotate" | "crop";

// 사진을 고르면 바로 폼에 붙지 않고, 먼저 회전 각도를 정한 뒤(1단계), 그 결과물 위에서
// 자유 비율로 자른다(2단계). "적용"을 누르면 최종 결과를 hidden 파일 입력(name={name})에
// 넣어서, 폼 제출 시 이 결과물이 올라간다.
export function ImageCropInput({ name, className }: { name: string; className?: string }) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [stage, setStage] = useState<Stage>("closed");
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flatImageSrc, setFlatImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PercentCrop>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawImageSrc(URL.createObjectURL(file));
    setRotation(0);
    setStage("rotate");
    dialogRef.current?.showModal();
    // 같은 파일을 다시 골라도 onChange가 다시 뜨도록 비워둔다.
    e.target.value = "";
  }

  async function confirmRotation() {
    if (!rawImageSrc) return;
    const blob = await rotateImage(rawImageSrc, rotation);
    setFlatImageSrc(URL.createObjectURL(blob));
    setCrop(undefined);
    setCompletedCrop(undefined);
    setStage("crop");
  }

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop({ unit: "%", width: 90, height: 90 }, width, height));
  }

  async function applyCrop() {
    if (!flatImageSrc || !completedCrop) return;
    const blob = await cropImageByPercent(flatImageSrc, completedCrop);
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (hiddenInputRef.current) hiddenInputRef.current.files = transfer.files;

    setPreviewUrl(URL.createObjectURL(blob));
    closeDialog();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setStage("closed");
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={hiddenInputRef} type="file" name={name} className="hidden" />

      <div className="flex items-center gap-3">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-24 w-24 rounded-md object-cover" />
        )}
        <label
          className={
            className ??
            "inline-block w-fit cursor-pointer rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          }
        >
          {previewUrl ? "다시 선택" : "사진 선택"}
          <input type="file" accept="image/*" onChange={handlePick} className="hidden" />
        </label>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setStage("closed")}
        className="m-auto w-full max-w-md rounded-md border border-neutral-200 bg-white p-4 backdrop:bg-black/50 dark:border-neutral-700 dark:bg-neutral-900"
      >
        {stage === "rotate" && rawImageSrc && (
          <div className="flex flex-col gap-3">
            <div className="flex h-72 w-full items-center justify-center overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rawImageSrc}
                alt=""
                style={{ transform: `rotate(${rotation}deg)` }}
                className="max-h-full max-w-full object-contain transition-transform"
              />
            </div>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              회전 ({rotation}도)
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmRotation}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
              >
                다음: 자르기
              </button>
            </div>
          </div>
        )}

        {stage === "crop" && flatImageSrc && (
          <div className="flex flex-col gap-3">
            <div className="flex max-h-[60vh] w-full items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flatImageSrc}
                  alt=""
                  onLoad={handleImageLoad}
                  style={{ maxHeight: "60vh", maxWidth: "100%", display: "block" }}
                />
              </ReactCrop>
            </div>
            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={() => setStage("rotate")}
                className="text-sm text-neutral-500 hover:underline"
              >
                ← 회전 다시
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={applyCrop}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
