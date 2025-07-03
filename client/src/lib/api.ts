import { apiRequest } from "./queryClient";

export const api = {
  uploadCV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiRequest('POST', '/api/cv/upload', formData);
    return response.json();
  },

  getCVFile: async (id: number) => {
    const response = await apiRequest('GET', `/api/cv/${id}`);
    return response.json();
  },

  getExtractedInfo: async (cvId: number) => {
    const response = await apiRequest('GET', `/api/cv/${cvId}/extracted`);
    return response.json();
  },

  updateExtractedInfo: async (cvId: number, data: any) => {
    const response = await apiRequest('PATCH', `/api/cv/${cvId}/extracted`, data);
    return response.json();
  },

  getAllCVFiles: async () => {
    const response = await apiRequest('GET', '/api/cv');
    return response.json();
  },

  deleteCVFile: async (id: number) => {
    await apiRequest('DELETE', `/api/cv/${id}`);
  },
};
