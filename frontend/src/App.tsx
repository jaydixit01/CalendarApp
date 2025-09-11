import { Toaster } from "sonner";
import AppShell from "@/components/AppShell";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster richColors position="top-right" />
      <AppShell />
    </div>
  );
}

export default App;
