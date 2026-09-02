import api from "./api";

export interface PersonalDocumentDto {
  id: number;
  category: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  description?: string;
  createdAt: string;
}

export const DOCUMENT_CATEGORIES = [
  "Aadhar Card",
  "PAN Card",
  "Passport",
  "Driving License",
  "Voter ID",
  "Bank Passbook",
  "Educational Certificates",
  "Experience Letters",
  "Offer Letters",
  "Agreements",
  "Insurance",
  "Medical Records",
  "General",
  "Other",
];

export const personalDocumentService = {
  upload: async (
    file: File,
    category: string,
    description?: string
  ): Promise<PersonalDocumentDto> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (description) formData.append("description", description);
    const res = await api.post("/personal-documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  list: async (category?: string): Promise<PersonalDocumentDto[]> => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    const res = await api.get("/personal-documents", { params });
    return res.data;
  },

  getDownloadUrl: (id: number): string => {
    const base = api.defaults.baseURL || "";
    return `${base}/personal-documents/${id}`;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/personal-documents/${id}`);
  },
};
