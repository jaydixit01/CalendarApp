import { useMemo, useState } from "react";
import { useTasks } from "@/store/useTasks";
import { dayjs, groupByDay, toDateTime, guessBrowserTZ } from "@/utils/date";

export default function CalendarMonth() {
  const events = useTasks((s) => s.events);
  const toggleCompleted = useTasks((s) => s.toggleCompleted);
  const [cursorMonth, setCursorMonth] = useState(dayjs());
  const [openDay, setOpenDay] = useState<string | null>(null);

  const startOfMonth = cursorMonth.startOf("month");
  const endOfMonth = cursorMonth.endOf("month");
  const startGrid = startOfMonth.startOf("week");
  const endGrid = endOfMonth.endOf("week");

  const days = useMemo(() => {
    const arr: ReturnType<typeof dayjs>[] = [];
    let d = startGrid;
    while (d.isBefore(endGrid) || d.isSame(endGrid, "day")) {
      arr.push(d);
      d = d.add(1, "day");
    }
    return arr;
  }, [startGrid.valueOf(), endGrid.valueOf()]);

  const grouped = useMemo(() => groupByDay(events), [events]);

  const weekdayHeaders = Array.from({ length: 7 }).map((_, i) =>
    startGrid.add(i, "day").format("ddd")
  );

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          className="rounded-lg border px-3 py-1"
          onClick={() => setCursorMonth((m) => m.subtract(1, "month"))}
        >
          ◀
        </button>
        <div className="text-lg font-semibold">
          {cursorMonth.format("MMMM YYYY")}
        </div>
        <button
          className="rounded-lg border px-3 py-1"
          onClick={() => setCursorMonth((m) => m.add(1, "month"))}
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500">
        {weekdayHeaders.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((dt) => {
          const key = dt.format("YYYY-MM-DD");
          const dayEvents = grouped[key] || [];
          const inMonth = dt.isSame(cursorMonth, "month");
          const show = dayEvents.slice(0, 3);
          const extra = dayEvents.length - show.length;
          return (
            <button
              key={key}
              onClick={() => setOpenDay(key)}
              className={`relative h-28 rounded-xl border p-2 text-left ${
                inMonth ? "bg-white" : "bg-gray-50"
              }`}
            >
              <span className="absolute right-2 top-2 text-xs text-gray-500">
                {dt.format("D")}
              </span>
              <div className="mt-5 flex flex-col gap-1">
                {show.map((e) => (
                  <div
                    key={e.id}
                    className={`truncate rounded-md px-2 py-1 text-xs ${
                      e.completed ? "line-through opacity-50" : ""
                    } bg-gray-100`}
                  >
                    {!e.allDay ? (
                      <span className="mr-1 text-gray-600">
                        {toDateTime(e, "start").tz(e.timezone || guessBrowserTZ()).format("hh:mm A")}
                      </span>
                    ) : null}
                    {e.title}
                  </div>
                ))}
                {extra > 0 ? (
                  <div className="text-xs text-gray-500">+{extra} more</div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {openDay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold">{dayjs(openDay).format("dddd, MMM D")}</div>
              <button className="rounded-md border px-2 py-1" onClick={() => setOpenDay(null)}>
                Close
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {(grouped[openDay] || []).map((e) => (
                <label key={e.id} className="flex items-start gap-3 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={e.completed}
                    onChange={() => toggleCompleted(e.id)}
                    className="mt-1"
                  />
                  <div className={e.completed ? "line-through opacity-50" : ""}>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-gray-600">
                      {e.allDay
                        ? "All day"
                        : `${toDateTime(e, "start")
                            .tz(e.timezone || guessBrowserTZ())
                            .format("hh:mm A")} – ${toDateTime(e, "end")
                            .tz(e.timezone || guessBrowserTZ())
                            .format("hh:mm A")}`}
                    </div>
                    {e.location ? (
                      <div className="text-xs text-gray-500">{e.location}</div>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


