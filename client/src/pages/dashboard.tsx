import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import FileUpload from "@/components/FileUpload";
import CVAnalysisForm from "@/components/CVAnalysisForm";
import CVHistory from "@/components/CVHistory";
import { Button } from "@/components/ui/button";
import { BookOpen, Bell } from "lucide-react";

export default function Dashboard() {
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Upload & Analyze CV</h2>
              <nav className="flex space-x-2 text-sm text-gray-500 mt-1">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-primary">Upload CV</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                API Docs
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          <FileUpload onUploadSuccess={setSelectedCvId} />
          
          {selectedCvId && (
            <CVAnalysisForm cvId={selectedCvId} />
          )}
          
          <CVHistory onSelectCv={setSelectedCvId} />
        </div>
      </main>
    </div>
  );
}
