import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getItemOptions } from "@/lib/events";
import { addChecklistItem, deleteChecklistItem, toggleChecklistItem, renameBooth } from "@/lib/actions/events";
import { BackButton } from "@/components/back-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ChecklistItemForm } from "@/components/checklist-item-form";
import { EditBoothForm } from "@/components/edit-booth-form";
import { itemHref } from "@/lib/nav";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, itemOptions] = await Promise.all([getEvent(id), getItemOptions()]);

  if (!event) notFound();

  const boothMap = new Map<string, typeof event.entries>();
  for (const entry of event.entries) {
    if (!boothMap.has(entry.booth)) boothMap.set(entry.booth, []);
    boothMap.get(entry.booth)!.push(entry);
  }
  const boothGroups = [...boothMap.entries()];

  const from = `/events/${id}`;

  return (
    <div className="box-border mx-auto w-full max-w-xl overflow-x-hidden p-6">
      <BackButton href="/events" />
      <h1 className="mb-1 text-xl font-semibold">{event.name}</h1>
      <p className="mb-6 text-sm text-neutral-500">
        {event.date ? event.date.toLocaleDateString("ko-KR") : "날짜 미정"}
      </p>

      <ChecklistItemForm
        action={addChecklistItem.bind(null, event.id)}
        itemOptions={itemOptions.map((item) => ({ ...item, price: Number(item.price) }))}
      />

      {boothGroups.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">아직 등록한 항목이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {boothGroups.map(([booth, entries]) => {
            const boothTotal = entries.reduce((sum, e) => sum + Number(e.price) * e.quantity, 0);
            return (
            <div key={booth} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{booth}</h2>
                <EditBoothForm currentName={booth} action={renameBooth.bind(null, event.id, booth)} />
              </div>
              {boothTotal > 0 && (
                <p className="mb-2 text-xs text-neutral-500">
                  부스 합계 {boothTotal.toLocaleString("ko-KR")}원
                </p>
              )}
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`flex items-start gap-2 rounded-md border border-neutral-200 p-2 dark:border-neutral-800 ${
                      entry.checked ? "opacity-50" : ""
                    }`}
                  >
                    <form action={toggleChecklistItem.bind(null, entry.id)}>
                      <button
                        type="submit"
                        className="flex h-8 w-8 items-center justify-center text-2xl leading-none"
                        aria-label="완료 체크"
                      >
                        {entry.checked ? "☑" : "☐"}
                      </button>
                    </form>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                            entry.type === "PICKUP"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {entry.type === "PICKUP" ? "수령" : "구매"}
                        </span>
                        {entry.item && (
                          <Link
                            href={itemHref(entry.item.id, from)}
                            className="shrink-0 text-xs text-blue-600 underline dark:text-blue-400"
                          >
                            상세보기 →
                          </Link>
                        )}
                      </div>
                      <p className={`mt-1 text-sm ${entry.checked ? "line-through" : ""}`}>{entry.label}</p>
                      {Number(entry.price) > 0 && (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {Number(entry.price).toLocaleString("ko-KR")}원 × {entry.quantity}개 ={" "}
                          {(Number(entry.price) * entry.quantity).toLocaleString("ko-KR")}원
                        </p>
                      )}
                    </div>
                    <form action={deleteChecklistItem.bind(null, entry.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="이 항목을 삭제하시겠습니까?"
                        className="text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
