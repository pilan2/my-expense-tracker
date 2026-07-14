import { restoreBackup } from "@/lib/actions/backup";
import { BackButton } from "@/components/back-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default function BackupPage() {
  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton />
      <h1 className="mb-6 text-xl font-semibold">백업</h1>

      <div className="mb-8 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-2 font-medium">백업 다운로드</h2>
        <p className="mb-3 text-sm text-neutral-500">
          현재 모든 품목과 판매 이력을 JSON 파일로 내려받습니다.
        </p>
        <a
          href="/api/backup"
          className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          다운로드
        </a>
      </div>

      <div className="rounded-md border border-red-200 p-4 dark:border-red-900">
        <h2 className="mb-2 font-medium">백업 불러오기</h2>
        <p className="mb-3 text-sm text-neutral-500">
          선택한 백업 파일 내용으로{" "}
          <span className="font-medium text-red-600">
            현재 모든 품목과 판매 이력을 완전히 교체
          </span>
          합니다. 되돌릴 수 없으니 신중하게 진행해주세요.
        </p>
        <form action={restoreBackup} className="flex flex-col gap-3">
          <input type="file" name="file" accept="application/json" required className="text-sm" />
          <ConfirmSubmitButton
            confirmMessage="정말로 불러오시겠습니까? 현재 모든 품목과 판매 이력이 삭제되고 백업 파일 내용으로 교체됩니다. 되돌릴 수 없습니다."
            className="self-start rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            불러오기 (기존 데이터 교체)
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
