import api from "./api";

export const subcontractingReportService = {
  getWorkOrderReport: async (params?: { projectId?: number; contractorId?: number; status?: string }): Promise<any[]> => {
    const res = await api.get("/subcontracting-reports/work-orders", { params });
    return res.data;
  },
  getContractorBillReport: async (contractorId?: number): Promise<any[]> => {
    const res = await api.get("/subcontracting-reports/contractor-bills", { params: { contractorId } });
    return res.data;
  },
  getWOReportByUnit: async (projectId?: number): Promise<any[]> => {
    const res = await api.get("/subcontracting-reports/wo-by-unit", { params: { projectId } });
    return res.data;
  },
  getWOReportByActivity: async (jobId?: number): Promise<any[]> => {
    const res = await api.get("/subcontracting-reports/wo-by-activity", { params: { jobId } });
    return res.data;
  },
  getMBReportByActivity: async (workOrderId?: number): Promise<any[]> => {
    const res = await api.get("/subcontracting-reports/mb-by-activity", { params: { workOrderId } });
    return res.data;
  },
  getBillApprovalHistory: async (params?: { contractorId?: number; status?: string }): Promise<any[]> => {
    const res = await api.get("/subcontracting-reports/bill-approval-history", { params });
    return res.data;
  },
};

export const subcontractingDashboardService = {
  getSummary: async (projectId?: number): Promise<any> => {
    const res = await api.get("/subcontracting-dashboard", { params: { projectId } });
    return res.data;
  },
};
