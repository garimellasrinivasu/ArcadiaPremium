import { useState, useEffect } from "react";
import { subcontractingReportService } from "../services/subcontractingReportService";
import api from "../services/api";

interface ProjectOption { id: number; name: string; }

const formatCurrency = (val: number) =>
  "₹" + (val ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WOReportByUnitPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<number | undefined>();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setGenerated(true);
    try {
      const result = await subcontractingReportService.getWOReportByUnit(projectId);
      setData(result);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setData([]);
    }
    setLoading(false);
  };

  const totalWOs = data.reduce((sum, r) => sum + (r.totalWorkOrders ?? 0), 0);
  const totalAmount = data.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-bold text-gray-800 mb-4">WO Report By Unit</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
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
        <div className="text-center py-10 text-gray-400">Select a project and click Generate Report.</div>
      ) : loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No data found for the selected project.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Work Orders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.projectName || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.totalWorkOrders ?? 0}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(r.totalAmount ?? 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-4 py-3 font-bold text-gray-700 uppercase text-xs">Total</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{totalWOs}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
