import api from "./api";

export interface InvoiceBookEntryDto {
  id?: number;
  projectName?: string;
  serialNumber?: number;
  invoiceNo?: string;
  supplierContractorName?: string;
  invoiceDate?: string; // ISO date
  invoiceValue?: number;
  materialWorkDetails?: string;
  invoiceNarration?: string;
  updatedInTally?: boolean;
  entryMode?: string; // MANUAL or IMAGE
  invoiceImageBase64?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const invoiceBookService = {
  async list(projectName: string): Promise<InvoiceBookEntryDto[]> {
    const { data } = await api.get<InvoiceBookEntryDto[]>("/invoice-book", { params: { projectName } });
    return data;
  },

  async getById(id: number): Promise<InvoiceBookEntryDto> {
    const { data } = await api.get<InvoiceBookEntryDto>(`/invoice-book/${id}`);
    return data;
  },

  async create(dto: InvoiceBookEntryDto): Promise<InvoiceBookEntryDto> {
    const { data } = await api.post<InvoiceBookEntryDto>("/invoice-book", dto);
    return data;
  },

  async update(id: number, dto: InvoiceBookEntryDto): Promise<InvoiceBookEntryDto> {
    const { data } = await api.put<InvoiceBookEntryDto>(`/invoice-book/${id}`, dto);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/invoice-book/${id}`);
  },

  async extractImage(imageBase64: string): Promise<InvoiceBookEntryDto> {
    const { data } = await api.post<InvoiceBookEntryDto>("/invoice-book/extract-image", { imageBase64 });
    return data;
  },

  async exportExcel(projectName: string): Promise<Blob> {
    const { data } = await api.get("/invoice-book/export", {
      params: { projectName },
      responseType: "blob",
    });
    return data;
  },
};
