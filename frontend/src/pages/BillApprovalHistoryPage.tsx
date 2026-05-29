import { useState, useEffect } from "react";
import { subcontractingReportService } from "../services/subcontractingReportService";
import api from "../services/api";

interface ContractorOption { id: number; name: string; }

const BILL_STATUSES = ["All", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  PAID: "bg-emerald-100 text-emerald-700",
};

const formatCurrency = (val: number) =>
  "₹" + (val ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (val?: string) =>
  val ? new Date(val).toLocaleDateString("en-IN") : "—";

const formatDateTime = (val?: string) =>
  val ? new Date(val).toLocaleString("en-IN") : "—";

export default function BillApprovalHistoryPage() {
  const [contractors, setContractors] = useState<ContractorOption[]>([]);
  const [contractorId, setContractorId] = useState<number | undefined>();
  const [status, setStatus] = useState("All");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    api.get("/contractors").then((r) => setContractors(r.data)).catch(() => {});
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setGenerated(true);
    try {
      const params: any = {};
      if (contractorId) params.contractorId = contractorId;
      if (status !== "All") params.status = status;
      const result = await subcontractingReportService.getBillApprovalHistory(params);
      setData(result);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setData([]);
    }
    setLoading(false);
  };

  const totalAmount = data.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Bill Approval History</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
            <label className="block text-xs text-gray-500 mb-1">Contractor</label>
            <select
              value={contractorId ?? ""}
              onChange={(e) => setContractorId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Contractors</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {BILL_STATUSES.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Results */}
      {!generated ? (
        <div className="text-center py-10 text-gray-400">Select filters and click Generate Report.</div>
      ) : loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No bill approval history found for the selected filters.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bill Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contractor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Work Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bill Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bill Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted At</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Approved At</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.billNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.contractorName || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.woNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.billType || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(r.billDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(r.totalAmount ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>
                      {r.status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{formatDateTime(r.submittedAt)}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{formatDateTime(r.approvedAt)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-700 uppercase text-xs">Total</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(totalAmount)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
