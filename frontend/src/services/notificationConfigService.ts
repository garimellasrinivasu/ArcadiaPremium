import api from "./api";

export interface NotificationConfigDto {
  id?: number;
  projectName: string;
  configType: "WHATSAPP" | "EMAIL";
  recipientName: string;
  recipientValue: string;
  active: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface NotificationStatus {
  whatsappConfigured: boolean;
  emailConfigured: boolean;
  emailFrom?: string;
  totalConfigs: number;
}

export interface TestEmailResult {
  from: string;
  to: string;
  timestamp: string;
  success: boolean;
  message?: string;
  error?: string;
}

export interface SendResult {
  projectName: string;
  sentAt: string;
  whatsappConfigured: boolean;
  results: Array<{
    type: string;
    recipient: string;
    name: string;
    imageSent?: boolean;
    textSent?: boolean;
    excelSent?: boolean;
    villaWiseExcelSent?: boolean;
    sent?: boolean;
  }>;
}

export const notificationConfigService = {
  getConfigs: (projectName?: string) =>
    api
      .get<NotificationConfigDto[]>("/notifications/config", {
        params: projectName ? { projectName } : {},
      })
      .then((r) => r.data),

  addConfig: (dto: NotificationConfigDto) =>
    api.post<NotificationConfigDto>("/notifications/config", dto).then((r) => r.data),

  updateConfig: (id: number, dto: NotificationConfigDto) =>
    api.put<NotificationConfigDto>(`/notifications/config/${id}`, dto).then((r) => r.data),

  deleteConfig: (id: number) =>
    api.delete(`/notifications/config/${id}`),

  sendSummary: (projectName: string) =>
    api
      .post<SendResult>("/notifications/send", null, { params: { projectName } })
      .then((r) => r.data),

  getStatus: () =>
    api.get<NotificationStatus>("/notifications/status").then((r) => r.data),

  downloadExcel: (projectName: string) =>
    api
      .get("/notifications/report/excel", {
        params: { projectName },
        responseType: "blob",
      })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `WorkExecution_${projectName.replace(/\s+/g, "_")}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }),

  downloadVillaWiseExcel: (projectName: string) =>
    api
      .get("/notifications/report/villa-status-excel", {
        params: { projectName },
        responseType: "blob",
      })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `VillaWise_Status_${projectName.replace(/\s+/g, "_")}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }),

  getSummary: (projectName: string) =>
    api
      .get<Record<string, unknown>>("/notifications/report/summary", {
        params: { projectName },
      })
      .then((r) => r.data),

  sendTestEmail: (toAddress: string) =>
    api
      .post<TestEmailResult>("/notifications/test-email", null, {
        params: { toAddress },
      })
      .then((r) => r.data),
};
