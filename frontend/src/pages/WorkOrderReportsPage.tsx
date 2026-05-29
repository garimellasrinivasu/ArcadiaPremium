import { useState, useEffect } from "react";
import { subcontractingReportService } from "../services/subcontractingReportService";
import api from "../services/api";

interface ProjectOption { id: number; name: string; }
interface ContractorOption { id: number; name: string; }

const WO_STATUSES = ["All", "DRAFT", "ISSUED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ISSUED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const formatCurrency = (val: number) =>
  "₹" + (val ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WorkOrderReportsPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [contractors, setContractors] = useState<ContractorOption[]>([]);
  const [projectId, setProjectId] = useState<number | undefined>();
  const [contractorId, setContractorId] = useState<number | undefined>();
  const [status, setStatus] = useState("All");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data)).catch(() => {});
    api.get("/contractors").then((r) => setContractors(r.data)).catch(() => {});
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setGenerated(true);
    try {
      const params: any = {};
      if (projectId) params.projectId = projectId;
      if (contractorId) params.contractorId = contractorId;
      if (status !== "All") params.status = status;
      const result = await subcontractingReportService.getWorkOrderReport(params);
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
      <h1 className="text-xl font-bold text-gray-800 mb-4">Work Order Reports</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <label className="block text-xs text-gray-500 mb-1">Project</label>
            <select
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
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
              {WO_STATUSES.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Statuses" : s.replace(/_/g, " ")}</option>
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
        <div className="text-center py-10 text-gray-400">No work orders found for the selected filters.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">WO Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Job</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contractor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">WO Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contract Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Work Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.woNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.jobName || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.projectName || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.contractorName || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.woDate ? new Date(r.woDate).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>
                      {(r.status || "").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.contractType || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(r.totalAmount ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.workDuration != null ? `${r.workDuration} days` : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={7} className="px-4 py-3 text-right font-bold text-gray-700 uppercase text-xs">Total</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(totalAmount)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
