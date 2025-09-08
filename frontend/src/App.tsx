import React from "react";
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input";
import { toast, Toaster } from "sonner";


function App() {

  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  async function handleUpload(){
    setIsUploading(true);
    if(!file) return;
    const formData = new FormData();
    formData.append("file", file);
    console.log("form Data: ", formData.get("file"));

    try{
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if(!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      console.log(data);
      toast.success("Upload Successful")
    } catch(error){
      toast.error("Upload Failed. Try again.")
    } finally{
      setIsUploading(false);
    }
   
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Toaster />
    <div className="flex flex-col items-center space-y-4">
      <Input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setFile(file);
            console.log("Selected file:", file);
          }
        }}
      />
      <Button disabled={!!!file || isUploading} onClick={handleUpload}>Upload</Button>
    </div>
  </div>
    
  )
}

export default App
