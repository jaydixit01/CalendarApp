import { useMemo, useState } from "react";
import { useTasks } from "@/store/useTasks";
import { toDateTime, guessBrowserTZ } from "@/utils/date";

type Filter = "all" | "active" | "completed";

export default function TaskList() {
  // Select pieces separately to avoid returning a new object each render
  const events = useTasks((s) => s.events);
  const toggleCompleted = useTasks((s) => s.toggleCompleted);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    const q = query.trim().toLowerCase();
    let list = safeEvents.filter((e) =>
      e && typeof e.title === "string" ? (q ? e.title.toLowerCase().includes(q) : true) : false
    );
    if (filter === "active") list = list.filter((e) => !e.completed);
    if (filter === "completed") list = list.filter((e) => e.completed);
    return list.sort((a, b) => {
      let at = Number.MAX_SAFE_INTEGER;
      let bt = Number.MAX_SAFE_INTEGER;
      try { at = toDateTime(a, "start").valueOf(); } catch {}
      try { bt = toDateTime(b, "start").valueOf(); } catch {}
      return sortAsc ? at - bt : bt - at;
    });
  }, [events, query, filter, sortAsc]);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">View and manage your tasks.</p>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title..."
            className="w-56 rounded-lg border px-3 py-2"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="rounded-lg border px-3 py-2"
        >
          Sort: {sortAsc ? "Ascending" : "Descending"}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-sm text-gray-500">
            No results. 
          </div>
        ) : null}
        {filtered.map((e) => {
          const tz = e.timezone || guessBrowserTZ();
          let subtitle = "";
          try {
            const start = toDateTime(e, "start").tz(tz);
            if (e.allDay) {
              subtitle = `${start.format("YYYY-MM-DD")}`;
            } else {
              const end = toDateTime(e, "end").tz(tz);
              subtitle = `${start.format("YYYY-MM-DD hh:mm A")} – ${end.format("hh:mm A")}`;
            }
          } catch {
            subtitle = e.allDay ? "All day" : "";
          }
          return (
            <label key={e.id} className="flex items-start gap-3 rounded-xl border p-3">
              <input
                type="checkbox"
                checked={e.completed}
                onChange={() => toggleCompleted(e.id)}
                className="mt-1"
              />
              <div className={e.completed ? "line-through opacity-50" : ""}>
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-gray-600">{subtitle}</div>
                {e.location ? (
                  <div className="text-xs text-gray-500">{e.location}</div>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}


