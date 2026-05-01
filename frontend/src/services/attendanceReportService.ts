import api from "./api";

export interface SiteSummary {
  siteName: string;
  totalRecords: number;
  totalWorkers: number;
  totalMale: number;
  totalFemale: number;
  totalMaleMastri: number;
  totalFemaleMastri: number;
  totalMaleHelper: number;
  totalFemaleHelper: number;
  totalDays: number;
}

export interface DateSummary {
  date: string;
  totalRecords: number;
  totalWorkers: number;
  totalMale: number;
  totalFemale: number;
  totalMaleMastri: number;
  totalFemaleMastri: number;
  totalMaleHelper: number;
  totalFemaleHelper: number;
  siteCount: number;
}

export interface AttendanceRecord {
  id: number;
  attendanceDate: string;
  siteName: string;
  totalWorkers: number;
  maleCount: number;
  femaleCount: number;
  maleMastriCount: number;
  femaleMastriCount: number;
  maleHelperCount: number;
  femaleHelperCount: number;
  remarks: string;
  submittedByName: string;
  status: string;
  approverName: string;
  approvedDate: string;
  imageBase64: string | null;
  capturedAt: string | null;
}

export interface AttendanceReportDto {
  fromDate: string;
  toDate: string;
  siteName: string | null;
  totalRecords: number;
  totalWorkers: number;
  totalMale: number;
  totalFemale: number;
  totalMaleMastri: number;
  totalFemaleMastri: number;
  totalMaleHelper: number;
  totalFemaleHelper: number;
  totalDays: number;
  siteSummaries: SiteSummary[];
  dateSummaries: DateSummary[];
  records: AttendanceRecord[];
}

export const attendanceReportService = {
  getReport: (fromDate: string, toDate: string, siteName?: string) => {
    const params: Record<string, string> = { fromDate, toDate };
    if (siteName) params.siteName = siteName;
    return api
      .get<AttendanceReportDto>("/attendance-reports", { params })
      .then((r) => r.data);
  },

  getSiteNames: () =>
    api.get<string[]>("/attendance-reports/sites").then((r) => r.data),

  downloadExcel: (fromDate: string, toDate: string, siteName?: string) => {
    const params: Record<string, string> = { fromDate, toDate };
    if (siteName) params.siteName = siteName;
    return api
      .get("/attendance-reports/export/excel", {
        params,
        responseType: "blob",
      })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_report_${fromDate}_${toDate}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  },

  downloadPdf: (fromDate: string, toDate: string, siteName?: string) => {
    const params: Record<string, string> = { fromDate, toDate };
    if (siteName) params.siteName = siteName;
    return api
      .get("/attendance-reports/export/pdf", {
        params,
        responseType: "blob",
      })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_report_${fromDate}_${toDate}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  },
};
