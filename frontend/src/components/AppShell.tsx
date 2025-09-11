import { useState } from "react";
import UploadSyllabus from "@/components/UploadSyllabus";
import CalendarMonth from "@/components/CalendarMonth";
import TaskList from "@/components/TaskList";
import ViewToggle from "@/components/ViewToggle";
import { useTasks } from "@/store/useTasks";

export default function AppShell() {
  const [view, setView] = useState<"month" | "list">("month");
  const clearAll = useTasks((s) => s.clearAll);
  const eventsCount = useTasks((s) => s.events.length);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Law Bandit</div>
          <div className="text-sm text-gray-500">Turn syllabi into actionable calendars</div>
        </div>
        <button className="rounded-lg border px-3 py-1 text-sm" onClick={clearAll}>
          Clear All
        </button>
      </header>
      <div className="mb-6">
        <UploadSyllabus />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <ViewToggle value={view} onChange={setView} />
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">{eventsCount} event(s)</div>
          <button
            type="button"
            className="rounded-lg bg-black px-3 py-2 text-sm text-white shadow-sm"
            disabled={eventsCount === 0}
          >
            Export to Google
          </button>
        </div>
      </div>
      {view === "month" ? <CalendarMonth /> : <TaskList />}
    </div>
  );
}


