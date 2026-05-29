import { useState, useEffect } from "react";
import { subcontractingDashboardService } from "../services/subcontractingReportService";
import api from "../services/api";

interface ProjectOption {
  id: number;
  name: string;
}

interface DashboardSummary {
  totalWorkOrders: number;
  totalWOAmount: number;
  woByStatus: Record<string, number>;
  totalMBs: number;
  totalMBAmount: number;
  totalRABills: number;
  totalRABillAmount: number;
  raBillsByStatus: Record<string, number>;
  totalPayments: number;
  totalPaymentAmount: number;
  recentWorkOrders: any[];
  recentRABills: any[];
  [key: string]: any; // allow extra keys from backend
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-200 text-gray-700",
  ISSUED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
};

const STATUS_BAR_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-400",
  ISSUED: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500",
  COMPLETED: "bg-green-500",
  SUBMITTED: "bg-blue-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
  PAID: "bg-emerald-500",
  PARTIALLY_PAID: "bg-amber-500",
};

const formatINR = (amount: number): string => {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function SubcontractingDashboardPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/projects").then((res) => setProjects(res.data)).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [selectedProjectId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await subcontractingDashboardService.getSummary(selectedProjectId);
      // Normalize keys — ensure all expected fields exist with safe defaults
      const normalized: DashboardSummary = {
        totalWorkOrders: data?.totalWorkOrders ?? 0,
        totalWOAmount: data?.totalWOAmount ?? 0,
        woByStatus: data?.woByStatus ?? {},
        totalMBs: data?.totalMBs ?? 0,
        totalMBAmount: data?.totalMBAmount ?? 0,
        totalRABills: data?.totalRABills ?? 0,
        totalRABillAmount: data?.totalRABillAmount ?? data?.totalBilledAmount ?? 0,
        raBillsByStatus: data?.raBillsByStatus ?? {},
        totalPayments: data?.totalPayments ?? 0,
        totalPaymentAmount: data?.totalPaymentAmount ?? data?.totalPaidAmount ?? 0,
        recentWorkOrders: data?.recentWorkOrders ?? [],
        recentRABills: data?.recentRABills ?? [],
      };
      setSummary(normalized);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      // Show dashboard with zeros instead of blank page
      setSummary({
        totalWorkOrders: 0, totalWOAmount: 0, woByStatus: {},
        totalMBs: 0, totalMBAmount: 0,
        totalRABills: 0, totalRABillAmount: 0, raBillsByStatus: {},
        totalPayments: 0, totalPaymentAmount: 0,
        recentWorkOrders: [], recentRABills: [],
      });
    }
    setLoading(false);
  };

  const renderStatusBars = (statusMap: Record<string, number>) => {
    const total = Object.values(statusMap).reduce((s, v) => s + v, 0);
    if (total === 0) return <p className="text-xs text-gray-400">No data</p>;
    return (
      <div className="space-y-1.5 mt-2">
        {Object.entries(statusMap).map(([status, count]) => (
          <div key={status} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-24 truncate">{status.replace(/_/g, " ")}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${STATUS_BAR_COLORS[status] || "bg-gray-400"}`}
                style={{ width: `${Math.max((count / total) * 100, 8)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Subcontracting Dashboard</h1>
      </div>

      {/* Project filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[250px]">
            <label className="block text-xs text-gray-500 mb-1">Project</label>
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading dashboard...</div>
      ) : !summary ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Summary Cards - 2x4 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Work Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Work Orders</p>
              <p className="text-2xl font-bold text-blue-700">{summary.totalWorkOrders}</p>
              <p className="text-sm text-gray-500 mt-1">{formatINR(summary.totalWOAmount)}</p>
            </div>

            {/* WO by Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">WO by Status</p>
              {renderStatusBars(summary.woByStatus || {})}
            </div>

            {/* Total Measurement Books */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Measurement Books</p>
              <p className="text-2xl font-bold text-green-700">{summary.totalMBs}</p>
              <p className="text-sm text-gray-500 mt-1">{formatINR(summary.totalMBAmount)}</p>
            </div>

            {/* Total RA Bills */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total RA Bills</p>
              <p className="text-2xl font-bold text-amber-700">{summary.totalRABills}</p>
              <p className="text-sm text-gray-500 mt-1">{formatINR(summary.totalRABillAmount)}</p>
            </div>

            {/* RA Bills by Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">RA Bills by Status</p>
              {renderStatusBars(summary.raBillsByStatus || {})}
            </div>

            {/* Total Payments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-emerald-700">{summary.totalPayments}</p>
              <p className="text-sm text-gray-500 mt-1">{formatINR(summary.totalPaymentAmount)}</p>
            </div>
          </div>

          {/* Recent tables side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Work Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Recent Work Orders</h3>
              {(summary.recentWorkOrders || []).length === 0 ? (
                <p className="text-xs text-gray-400">No recent work orders.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs text-gray-400 font-semibold">WO #</th>
                        <th className="text-left py-2 text-xs text-gray-400 font-semibold">Contractor</th>
                        <th className="text-right py-2 text-xs text-gray-400 font-semibold">Amount</th>
                        <th className="text-center py-2 text-xs text-gray-400 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary.recentWorkOrders || []).slice(0, 5).map((wo: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700 font-medium">{wo.woNumber || `WO-${wo.id}`}</td>
                          <td className="py-2 text-gray-600">{wo.contractorName || "—"}</td>
                          <td className="py-2 text-right text-gray-700">{formatINR(wo.totalAmount || 0)}</td>
                          <td className="py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[wo.status] || "bg-gray-100 text-gray-600"}`}>
                              {(wo.status || "").replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent RA Bills */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Recent RA Bills</h3>
              {(summary.recentRABills || []).length === 0 ? (
                <p className="text-xs text-gray-400">No recent RA bills.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs text-gray-400 font-semibold">Bill #</th>
                        <th className="text-left py-2 text-xs text-gray-400 font-semibold">Contractor</th>
                        <th className="text-right py-2 text-xs text-gray-400 font-semibold">Amount</th>
                        <th className="text-center py-2 text-xs text-gray-400 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary.recentRABills || []).slice(0, 5).map((bill: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700 font-medium">{bill.billNumber || `RA-${bill.id}`}</td>
                          <td className="py-2 text-gray-600">{bill.contractorName || "—"}</td>
                          <td className="py-2 text-right text-gray-700">{formatINR(bill.netPayable || bill.totalAmount || 0)}</td>
                          <td className="py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[bill.status] || "bg-gray-100 text-gray-600"}`}>
                              {(bill.status || "").replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
