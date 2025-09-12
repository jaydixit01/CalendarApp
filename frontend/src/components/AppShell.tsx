import { useState } from "react";
import UploadSyllabus from "@/components/UploadSyllabus";
import CalendarMonth from "@/components/CalendarMonth";
import TaskList from "@/components/TaskList";
import ViewToggle from "@/components/ViewToggle";
import { useTasks } from "@/store/useTasks";
import { toast } from "sonner";
import { Button } from "./ui/button";
import React from "react";

declare global {
  interface Window {
    google: typeof google;
  }
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const google: any;
}




export default function AppShell() {
  const [view, setView] = useState<"month" | "list">("month");
  const [gisReady, setGisReady] = useState(false);
  const clearAll = useTasks((s) => s.clearAll);
  const eventsCount = useTasks((s) => s.events.length);

  const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const scopes = import.meta.env.VITE_GOOGLE_SCOPES

  React.useEffect(() => {
    // If script already present (hot reload, nav), mark ready
    if (typeof window !== "undefined" && window.google?.accounts?.oauth2) {
      setGisReady(true);
    }
  }, []);

  async function handleGoogleImport() {
    console.log("before")
    if(!gisReady) return;
    console.log("after")
    
    try{
      const codeClient = google.accounts.oauth2.initCodeClient({
        client_id: clientID,
        scope: scopes,
        callback: async (response: any) => {
          const { code } = response;
 
 
          if (!code) {
            throw new Error("Failed to get authorization code");
          }

          console.log("events: ", useTasks.getState().events);
          const events = useTasks.getState().events;
 
          const res = await fetch("/api/export", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${code}`,
            },
            body: JSON.stringify({
              events: events,
            }),
            
          });
 
 
          if (!res.ok) {
            throw new Error("Failed to export events.");
          }
 
 
          // const { calendars } = await res.json();
          // setCalendars(calendars);
          // onSuccess(calendars);
        },
      });
 
 
      codeClient.requestCode();

    } catch(error){
      console.error("Google Import Error:", error);
      toast.error("An error occurred during Google Export.");
      return;
    }
    

  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      
      {/* <script
        src="https://apis.google.com/js/api.js"
        async defer
      /> */}

      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Law Bandit Internship Application</div>
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
          <Button
            className="rounded-lg bg-black px-3 py-2 text-sm text-white shadow-sm"
            disabled={eventsCount === 0}
            onClick={handleGoogleImport}
          >
            Export to Google
          </Button>
        </div>
      </div>
      {view === "month" ? <CalendarMonth /> : <TaskList />}
    </div>
  );
}


