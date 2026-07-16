import Link from "next/link";
import { getShipmentsInMonth, getUpcomingShipments, getShipmentsOnDate } from "@/lib/items";
import { getMonthGrid, shiftMonth } from "@/lib/calendar";
import { parseMonthParam, monthParamString } from "@/lib/month";
import { BackButton } from "@/components/back-button";
import { ItemCardContent } from "@/components/item-card";
import { isOverdue } from "@/lib/dday";
import { itemHref } from "@/lib/nav";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function monthHref(year: number, month: number) {
  return `/shipments?view=calendar&month=${monthParamString(year, month)}`;
}

function dayHref(dateStr: string, monthParam: string) {
  return `/shipments?view=day&date=${dateStr}&month=${monthParam}`;
}

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; date?: string }>;
}) {
  const { view: viewParam, month: monthParam, date: dateParam } = await searchParams;
  const view = viewParam === "list" ? "list" : viewParam === "day" ? "day" : "calendar";
  const { year: backYear, month: backMonth } = parseMonthParam(monthParam);

  return (
    <div className="box-border mx-auto w-full max-w-3xl overflow-x-hidden p-6">
      <BackButton href={view === "day" ? monthHref(backYear, backMonth) : "/"} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">발송 예정</h1>
        {view === "day" ? (
          <Link href={monthHref(backYear, backMonth)} className="text-sm underline">
            ← 달력으로
          </Link>
        ) : (
          <div className="flex gap-1 rounded-md border border-neutral-200 p-1 text-sm dark:border-neutral-800">
            <Link
              href="/shipments?view=calendar"
              className={`rounded px-3 py-1 ${view === "calendar" ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : ""}`}
            >
              달력
            </Link>
            <Link
              href="/shipments?view=list"
              className={`rounded px-3 py-1 ${view === "list" ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : ""}`}
            >
              목록
            </Link>
          </div>
        )}
      </div>

      {view === "calendar" && <CalendarView monthParam={monthParam} />}
      {view === "list" && <ListView />}
      {view === "day" && dateParam && <DayView dateStr={dateParam} />}
    </div>
  );
}

async function CalendarView({ monthParam }: { monthParam?: string }) {
  const { year, month } = parseMonthParam(monthParam);
  const items = await getShipmentsInMonth(year, month);
  const currentMonthParam = monthParamString(year, month);

  const itemsByDay = new Map<number, typeof items>();
  for (const item of items) {
    const day = item.expectedShipDate!.getDate();
    if (!itemsByDay.has(day)) itemsByDay.set(day, []);
    itemsByDay.get(day)!.push(item);
  }

  const weeks = getMonthGrid(year, month);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link href={monthHref(prev.year, prev.month)} className="text-sm underline">
          ← 이전달
        </Link>
        <p className="font-medium">
          {year}년 {month}월
        </p>
        <Link href={monthHref(next.year, next.month)} className="text-sm underline">
          다음달 →
        </Link>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {week.map((day, j) => {
              const dayItems = day ? (itemsByDay.get(day) ?? []) : [];
              const isToday = isCurrentMonth && day === today.getDate();
              const dateStr = day
                ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                : null;

              return (
                <div
                  key={j}
                  className={`min-h-16 min-w-0 rounded-md border p-1 text-xs ${
                    day ? "border-neutral-200 dark:border-neutral-800" : "border-transparent"
                  } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                >
                  {day && (
                    dayItems.length > 0 ? (
                      <Link href={dayHref(dateStr!, currentMonthParam)} className="block h-full">
                        <p className="mb-1 text-neutral-500 underline">{day}</p>
                        <div className="flex flex-col gap-0.5">
                          {dayItems.slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className={`truncate rounded px-1 py-0.5 ${
                                isOverdue(item.expectedShipDate!)
                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {item.character}
                            </span>
                          ))}
                          {dayItems.length > 3 && (
                            <span className="text-neutral-500">+{dayItems.length - 3}개</span>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <p className="mb-1 text-neutral-500">{day}</p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

async function ListView() {
  const items = await getUpcomingShipments();

  if (items.length === 0) {
    return <p className="py-10 text-center text-neutral-500">발송 예정인 품목이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={itemHref(item.id, "/shipments?view=list")}
            className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
          >
            <ItemCardContent {...item} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function DayView({ dateStr }: { dateStr: string }) {
  const items = await getShipmentsOnDate(dateStr);
  const from = `/shipments?view=day&date=${dateStr}`;

  return (
    <>
      <p className="mb-4 font-medium">{dateStr}</p>
      {items.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">이 날짜에 발송 예정인 품목이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={itemHref(item.id, from)}
                className="block rounded-md border border-neutral-200 p-3 hover:opacity-70 dark:border-neutral-800"
              >
                <ItemCardContent {...item} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
