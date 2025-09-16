import { useState } from "react";
import { useTasks, normalizeParsedEvents } from "@/store/useTasks";
import { guessBrowserTZ } from "@/utils/date";
import type { ParsedEvent } from "@/types";
import { toast } from "sonner";

export default function UploadSyllabus() {
  const [file, setFile] = useState<File | null>(null);
  const [tz] = useState<string>(guessBrowserTZ());
  const [loading, setLoading] = useState(false);
  const setEvents = useTasks((s) => s.setEvents);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("timezone", tz);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data: { events: ParsedEvent[] } = await res.json();
      const normalized = normalizeParsedEvents(data.events, tz);
      setEvents(normalized);
      toast.success(`Imported ${normalized.length} event(s).`);
    } catch (e) {
      toast.error("Failed to upload syllabus. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
      setFile(null)
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Syllabus PDF</label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full rounded-lg border p-2"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 text-white disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload & Parse"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          We only send the file to parse your events. Nothing is stored server-side.
        </p>
      </div>
    </div>
  );
}


