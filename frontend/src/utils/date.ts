import dayjsLib from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ParsedEvent, TaskEvent } from "@/types";

dayjsLib.extend(utc);
dayjsLib.extend(timezone);

export const dayjs = dayjsLib;

export function guessBrowserTZ(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function toDateTime(e: ParsedEvent, which: "start" | "end") {
  const tz = e.timezone || guessBrowserTZ();
  if (e.allDay) {
    if (which === "start") {
      return dayjs.tz(`${e.startDate}T00:00:00`, tz);
    }
    // all-day end is exclusive next-day midnight; if endDate missing, use startDate + 1 day
    const endDate = e.endDate || e.startDate;
    return dayjs.tz(`${endDate}T00:00:00`, tz).add(1, "day");
  }
  // timed
  const startTime = e.startTime || "00:00";
  const start = dayjs.tz(`${e.startDate}T${startTime}:00`, tz);
  if (which === "start") return start;
  const endTime = e.endTime;
  if (endTime) return dayjs.tz(`${e.startDate}T${endTime}:00`, tz);
  return start.add(60, "minute");
}

export function groupByDay(events: TaskEvent[]) {
  const map: Record<string, TaskEvent[]> = {};
  for (const ev of events) {
    // Determine the local day key in the event's timezone using start
    const key = toDateTime(ev, "start").tz(ev.timezone || guessBrowserTZ()).format("YYYY-MM-DD");
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  }
  return map as { [yyyyMmDd: string]: TaskEvent[] };
}

export function formatDay(dt: ReturnType<typeof dayjs>) {
  return {
    yyyyMmDd: dt.format("YYYY-MM-DD"),
    monthName: dt.format("MMMM"),
    dayOfMonth: dt.format("D"),
    weekdayShort: dt.format("ddd"),
  };
}


