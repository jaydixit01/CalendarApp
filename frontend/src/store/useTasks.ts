import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TaskEvent, ParsedEvent } from "@/types";
import { guessBrowserTZ } from "@/utils/date";

type TaskState = {
  events: TaskEvent[];
  setEvents: (events: TaskEvent[]) => void;
  toggleCompleted: (id: string) => void;
  clearAll: () => void;
};

export const useTasks = create<TaskState>()(
  persist(
    (set, get) => ({
      events: [],
      setEvents: (events) => set({ events }),
      toggleCompleted: (id) => {
        const events = get().events.map((e) =>
          e.id === id ? { ...e, completed: !e.completed } : e
        );
        set({ events });
      },
      clearAll: () => set({ events: [] }),
    }),
    { name: "lawbandit.events.v1" }
  )
);

export function normalizeParsedEvents(
  raw: ParsedEvent[],
  fallbackTz?: string
): TaskEvent[] {
  const defaultTz = fallbackTz || guessBrowserTZ();
  return raw.map((e) => ({
    ...e,
    timezone: e.timezone || defaultTz,
    id: crypto.randomUUID(),
    completed: false,
  }));
}


