import api from "./api";
import type { SaleEntry, CreateSaleEntryRequest, UpdatePaymentRequest, AddPaymentRequest, PaymentEntry } from "../types/user";

export const saleService = {
  async getAll(): Promise<SaleEntry[]> {
    const { data } = await api.get<SaleEntry[]>("/sales");
    return data;
  },

  async getById(id: number): Promise<SaleEntry> {
    const { data } = await api.get<SaleEntry>(`/sales/${id}`);
    return data;
  },

  async search(name: string): Promise<SaleEntry[]> {
    const { data } = await api.get<SaleEntry[]>(`/sales/search?name=${encodeURIComponent(name)}`);
    return data;
  },

  async searchByQuery(query: string): Promise<SaleEntry[]> {
    const { data } = await api.get<SaleEntry[]>(`/sales/search/query?q=${encodeURIComponent(query)}`);
    return data;
  },

  async create(entry: CreateSaleEntryRequest): Promise<SaleEntry> {
    const { data } = await api.post<SaleEntry>("/sales", entry);
    return data;
  },

  async update(id: number, entry: CreateSaleEntryRequest): Promise<SaleEntry> {
    const { data } = await api.put<SaleEntry>(`/sales/${id}`, entry);
    return data;
  },

  async updatePayment(id: number, payment: UpdatePaymentRequest): Promise<SaleEntry> {
    const { data } = await api.put<SaleEntry>(`/sales/${id}/payment`, payment);
    return data;
  },

  async addPayment(saleEntryId: number, payment: AddPaymentRequest): Promise<SaleEntry> {
    const { data } = await api.post<SaleEntry>(`/sales/${saleEntryId}/payments`, payment);
    return data;
  },

  async getPayments(saleEntryId: number): Promise<PaymentEntry[]> {
    const { data } = await api.get<PaymentEntry[]>(`/sales/${saleEntryId}/payments`);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/sales/${id}`);
  },
};
