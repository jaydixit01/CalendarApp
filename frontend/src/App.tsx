import { Toaster } from "sonner";
import AppShell from "@/components/AppShell";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script
        async defer
        src="https://accounts.google.com/gsi/client"
        //onLoad={() => setGisReady(true)}
      />
      <Toaster richColors position="top-right" />
      <AppShell />
    </div>
  );
}

export default App;
