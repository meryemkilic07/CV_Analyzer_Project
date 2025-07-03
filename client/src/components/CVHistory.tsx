import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, RotateCcw, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CvFile } from "@shared/schema";

interface CVHistoryProps {
  onSelectCv?: (cvId: number) => void;
}

export default function CVHistory({ onSelectCv }: CVHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cvFiles = [], isLoading } = useQuery({
    queryKey: ['/api/cv'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (cvId: number) => {
      await apiRequest('DELETE', `/api/cv/${cvId}`);
    },
    onSuccess: () => {
      toast({
        title: "CV deleted",
        description: "CV file has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cv'] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete CV file.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-50 text-green-600 border-green-200">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
            Complete
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></div>
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></div>
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-2"></div>
            Pending
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "CV";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Analysis History</h3>
          <p className="text-gray-600">Previously analyzed CV documents</p>
        </div>
        <Button variant="ghost" className="text-primary">
          View All
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {cvFiles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No CV files uploaded yet.</p>
          <p className="text-sm text-gray-400 mt-1">Upload your first CV to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">File</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Size</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Uploaded</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cvFiles.map((cvFile: CvFile & { extractedInfo?: any }) => (
                <tr key={cvFile.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary">
                          {getInitials(cvFile.extractedInfo?.fullName || cvFile.originalName)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {cvFile.extractedInfo?.fullName || cvFile.originalName}
                        </span>
                        {cvFile.extractedInfo?.email && (
                          <p className="text-sm text-gray-500">{cvFile.extractedInfo.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{formatFileSize(cvFile.fileSize)}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(cvFile.uploadedAt)}</td>
                  <td className="py-3 px-4">{getStatusBadge(cvFile.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectCv?.(cvFile.id)}
                        className="text-gray-400 hover:text-primary p-1 h-auto"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600 p-1 h-auto"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {cvFile.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-yellow-600 p-1 h-auto"
                          title="Retry Analysis"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(cvFile.id)}
                        disabled={deleteMutation.isPending}
                        className="text-gray-400 hover:text-red-500 p-1 h-auto"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
