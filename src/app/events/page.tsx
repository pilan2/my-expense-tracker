import Link from "next/link";
import { getEvents } from "@/lib/events";
import { createEvent, deleteEvent, updateEvent } from "@/lib/actions/events";
import { BackButton } from "@/components/back-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EditEventForm } from "@/components/edit-event-form";

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href="/" />
      <h1 className="mb-2 text-xl font-semibold">행사 체크리스트</h1>
      <p className="mb-6 text-sm text-neutral-500">
        행사 당일 부스별로 수령/구매할 것을 미리 적어두고, 현장에서 부스별로 묶어서 확인할 수 있어요.
      </p>

      <form action={createEvent} className="mb-8 flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          placeholder="행사 이름 (예: 2026 10디페(토))"
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          name="date"
          type="date"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          행사 추가
        </button>
      </form>

      {events.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">등록된 행사가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => {
            const doneCount = event.entries.filter((e) => e.checked).length;
            const totalSpent = event.entries.reduce(
              (sum, e) => sum + Number(e.price) * e.quantity,
              0,
            );
            // "낼 돈" = 아직 결제 안 한(현장 구매) 항목만의 합. 수령(PICKUP)은 이미 결제된 것이라 제외.
            const dueAmount = event.entries
              .filter((e) => e.type === "PURCHASE")
              .reduce((sum, e) => sum + Number(e.price) * e.quantity, 0);
            return (
              <li
                key={event.id}
                className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <Link href={`/events/${event.id}`} className="flex-1 hover:opacity-70">
                  <p className="font-medium">{event.name}</p>
                  <p className="text-sm text-neutral-500">
                    {event.date ? event.date.toLocaleDateString("ko-KR") : "날짜 미정"} · {doneCount}/
                    {event.entries.length}개 완료
                  </p>
                  {(totalSpent > 0 || dueAmount > 0) && (
                    <p className="text-sm text-neutral-500">
                      {totalSpent > 0 && `전체 지출 ${totalSpent.toLocaleString("ko-KR")}원`}
                      {totalSpent > 0 && dueAmount > 0 && " · "}
                      {dueAmount > 0 && `낼 돈 ${dueAmount.toLocaleString("ko-KR")}원`}
                    </p>
                  )}
                </Link>
                <div className="flex items-center gap-3">
                  <EditEventForm
                    currentName={event.name}
                    currentDate={event.date ? event.date.toISOString().slice(0, 10) : ""}
                    action={updateEvent.bind(null, event.id)}
                  />
                  <form action={deleteEvent.bind(null, event.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`"${event.name}" 행사를 삭제하시겠습니까? 체크리스트도 함께 삭제됩니다.`}
                      className="text-sm text-red-600 hover:underline"
                    >
                      삭제
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
