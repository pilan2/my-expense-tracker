import { LocalForm } from "@/components/local-form";
import Link from "@/lib/local/navigation";
import { getEvents, effectiveChecklistAmount } from "@/lib/events";
import { createEvent, deleteEvent, updateEvent } from "@/lib/actions/events";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EditEventForm } from "@/components/edit-event-form";
import { won } from "@/lib/money";
import { buttonClass, inputClass, EmptyState, PageHeader } from "@/components/ui";

export default  function EventsPage() {
  const events = getEvents();

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <PageHeader
        title="행사 체크리스트"
        description="행사 당일 부스별로 수령/구매할 것을 미리 적어두고, 현장에서 부스별로 묶어서 확인할 수 있어요."
      />

      <LocalForm action={createEvent} className="mb-8 flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          placeholder="행사 이름 (예: 2026 10디페(토))"
          required
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="date"
          type="date"
          className={inputClass}
        />
        <button
          type="submit"
          className={buttonClass()}
        >
          행사 추가
        </button>
      </LocalForm>

      {events.length === 0 ? (
        <EmptyState>등록된 행사가 없습니다.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => {
            const doneCount = event.entries.filter((e) => e.checked).length;
            const totalSpent = event.entries.reduce((sum, e) => sum + effectiveChecklistAmount(e), 0);
            // "낼 돈" = 아직 결제 안 한(현장 구매) 항목만의 합. 수령(PICKUP)은 이미 결제된 것이라 제외.
            const dueAmount = event.entries
              .filter((e) => e.type === "PURCHASE")
              .reduce((sum, e) => sum + effectiveChecklistAmount(e), 0);
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
                      {totalSpent > 0 && `전체 지출 ${won(totalSpent)}`}
                      {totalSpent > 0 && dueAmount > 0 && " · "}
                      {dueAmount > 0 && `낼 돈 ${won(dueAmount)}`}
                    </p>
                  )}
                </Link>
                <div className="flex items-center gap-3">
                  <EditEventForm
                    currentName={event.name}
                    currentDate={event.date ? event.date.toISOString().slice(0, 10) : ""}
                    action={updateEvent.bind(null, event.id)}
                  />
                  <LocalForm action={deleteEvent.bind(null, event.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`"${event.name}" 행사를 삭제할까요? 체크리스트도 함께 삭제됩니다.`}
                      className={buttonClass("dangerGhost")}
                    >
                      삭제
                    </ConfirmSubmitButton>
                  </LocalForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
