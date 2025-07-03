import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { CloudUpload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadSuccess?: (cvId: number) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  id: string;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/cv/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: "CV file has been uploaded and is being processed.",
      });
      setUploadingFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/cv'] });
      onUploadSuccess?.(data.id);
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload CV file. Please try again.",
        variant: "destructive",
      });
      setUploadingFiles([]);
    },
  });

  const handleFiles = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword' // .doc
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only PDF and Word documents are allowed.",
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const uploadingFile: UploadingFile = {
        file: validFiles[0],
        progress: 0,
        id: Math.random().toString(36),
      };
      
      setUploadingFiles([uploadingFile]);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { ...f, progress: Math.min(f.progress + 10, 90) } : f)
        );
      }, 200);

      uploadMutation.mutate(validFiles[0]);
      
      setTimeout(() => clearInterval(progressInterval), 2000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CV Documents</h3>
        <p className="text-gray-600">Upload PDF or Word documents to extract and analyze resume information automatically.</p>
      </div>
      
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragOver ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CloudUpload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">Drop your CV files here</h4>
            <p className="text-gray-500 mt-1">
              or{" "}
              <Button variant="link" className="p-0 h-auto font-medium text-primary" onClick={openFileDialog}>
                browse files
              </Button>
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <p>Supports: PDF and Word documents (.pdf, .docx, .doc) up to 10MB</p>
            <p>Multiple files can be uploaded simultaneously</p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {uploadingFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-gray-900">Upload Queue</h4>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">{file.file.name}</p>
                  <p className="text-sm text-gray-500">{(file.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500">{file.progress}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-red-500 p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
