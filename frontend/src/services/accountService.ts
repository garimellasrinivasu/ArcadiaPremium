import api from "./api";

/* ═══════════════════════════════════════════
   TYPES / DTOs
   ═══════════════════════════════════════════ */

export interface AccountCategoryDto {
  id?: number;
  projectName: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface AccountInvoiceDto {
  id?: number;
  entryId: number;
  invoiceDate: string;
  amount: number;
  description?: string;
}

export interface AccountPaymentDto {
  id?: number;
  entryId: number;
  paymentDate: string;
  amount: number;
  description?: string;
}

export interface AccountEntryDto {
  id?: number;
  projectName: string;
  categoryId: number;
  categoryCode?: string;
  categoryName?: string;
  serialNumber: number;
  name: string;
  itemWork?: string;
  totalInvoiced: number;
  totalPaid: number;
  balancePayable: number;
  invoices: AccountInvoiceDto[];
  payments: AccountPaymentDto[];
}

export interface AccountSummaryDto {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  totalInvoiced: number;
  totalPaid: number;
  balancePayable: number;
  categoryBreakdown: Record<string, number>;
}

export interface CategoryTotalDto {
  invoiced: number;
  paid: number;
  balance: number;
}

export interface VendorTotalDto {
  name: string;
  categoryCode: string;
  categoryName: string;
  itemWork: string;
  totalInvoiced: number;
  totalPaid: number;
  balancePayable: number;
}

/* ═══════════════════════════════════════════
   SERVICE
   ═══════════════════════════════════════════ */

export const accountService = {
  /* ---------- Categories ---------- */

  getCategories(projectName: string): Promise<AccountCategoryDto[]> {
    return api
      .get<AccountCategoryDto[]>("/accounts/categories", { params: { projectName } })
      .then((r) => r.data);
  },

  createCategory(dto: AccountCategoryDto): Promise<AccountCategoryDto> {
    return api.post<AccountCategoryDto>("/accounts/categories", dto).then((r) => r.data);
  },

  updateCategory(id: number, dto: AccountCategoryDto): Promise<AccountCategoryDto> {
    return api.put<AccountCategoryDto>(`/accounts/categories/${id}`, dto).then((r) => r.data);
  },

  deleteCategory(id: number): Promise<void> {
    return api.delete(`/accounts/categories/${id}`).then(() => undefined);
  },

  /* ---------- Entries ---------- */

  getEntries(projectName: string, categoryId?: number): Promise<AccountEntryDto[]> {
    return api
      .get<AccountEntryDto[]>("/accounts/entries", {
        params: { projectName, ...(categoryId != null ? { categoryId } : {}) },
      })
      .then((r) => r.data);
  },

  createEntry(dto: AccountEntryDto): Promise<AccountEntryDto> {
    return api.post<AccountEntryDto>("/accounts/entries", dto).then((r) => r.data);
  },

  updateEntry(id: number, dto: AccountEntryDto): Promise<AccountEntryDto> {
    return api.put<AccountEntryDto>(`/accounts/entries/${id}`, dto).then((r) => r.data);
  },

  deleteEntry(id: number): Promise<void> {
    return api.delete(`/accounts/entries/${id}`).then(() => undefined);
  },

  /* ---------- Invoices ---------- */

  addInvoice(entryId: number, dto: AccountInvoiceDto): Promise<AccountInvoiceDto> {
    return api
      .post<AccountInvoiceDto>(`/accounts/entries/${entryId}/invoices`, dto)
      .then((r) => r.data);
  },

  updateInvoice(id: number, dto: AccountInvoiceDto): Promise<AccountInvoiceDto> {
    return api.put<AccountInvoiceDto>(`/accounts/invoices/${id}`, dto).then((r) => r.data);
  },

  deleteInvoice(id: number): Promise<void> {
    return api.delete(`/accounts/invoices/${id}`).then(() => undefined);
  },

  /* ---------- Payments ---------- */

  addPayment(entryId: number, dto: AccountPaymentDto): Promise<AccountPaymentDto> {
    return api
      .post<AccountPaymentDto>(`/accounts/entries/${entryId}/payments`, dto)
      .then((r) => r.data);
  },

  updatePayment(id: number, dto: AccountPaymentDto): Promise<AccountPaymentDto> {
    return api.put<AccountPaymentDto>(`/accounts/payments/${id}`, dto).then((r) => r.data);
  },

  deletePayment(id: number): Promise<void> {
    return api.delete(`/accounts/payments/${id}`).then(() => undefined);
  },

  /* ---------- Ledger & Summaries ---------- */

  getLedger(projectName: string): Promise<AccountEntryDto[]> {
    return api
      .get<AccountEntryDto[]>("/accounts/ledger", { params: { projectName } })
      .then((r) => r.data);
  },

  getSummary(
    projectName: string,
    period: string,
    from: string,
    to: string
  ): Promise<AccountSummaryDto[]> {
    return api
      .get<AccountSummaryDto[]>("/accounts/summary", {
        params: { projectName, period, from, to },
      })
      .then((r) => r.data);
  },

  getCategoryTotals(projectName: string): Promise<Record<string, CategoryTotalDto>> {
    return api
      .get<Record<string, CategoryTotalDto>>("/accounts/category-totals", {
        params: { projectName },
      })
      .then((r) => r.data);
  },

  getVendorTotals(projectName: string, from?: string, to?: string): Promise<VendorTotalDto[]> {
    return api
      .get<VendorTotalDto[]>("/accounts/vendor-totals", {
        params: { projectName, ...(from ? { from } : {}), ...(to ? { to } : {}) },
      })
      .then((r) => r.data);
  },

  /* ---------- Import / Export ---------- */

  importExcel(projectName: string, file: File): Promise<{ imported: number }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectName", projectName);
    return api
      .post<{ imported: number }>("/accounts/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  async exportExcel(projectName: string): Promise<void> {
    const response = await api.get("/accounts/export", {
      params: { projectName },
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-ledger-${projectName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
