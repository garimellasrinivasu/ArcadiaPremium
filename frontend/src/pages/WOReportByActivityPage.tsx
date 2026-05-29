import { useState, useEffect } from "react";
import { subcontractingReportService } from "../services/subcontractingReportService";
import { jobService } from "../services/jobService";
import type { JobDto } from "../services/jobService";

const formatCurrency = (val: number) =>
  "₹" + (val ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WOReportByActivityPage() {
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [jobId, setJobId] = useState<number | undefined>();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    jobService.getAll().then(setJobs).catch(() => {});
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setGenerated(true);
    try {
      const result = await subcontractingReportService.getWOReportByActivity(jobId);
      setData(result);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setData([]);
    }
    setLoading(false);
  };

  const totalQty = data.reduce((sum, r) => sum + (r.totalQuantity ?? 0), 0);
  const totalAmount = data.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-bold text-gray-800 mb-4">WO Report By Activity</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
            <label className="block text-xs text-gray-500 mb-1">Job</label>
            <select
              value={jobId ?? ""}
              onChange={(e) => setJobId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.name}</option>
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
        <div className="text-center py-10 text-gray-400">Select a job and click Generate Report.</div>
      ) : loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No activity data found for the selected job.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Activity Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">UOM</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.activityName || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.uom || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{(r.totalQuantity ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(r.totalAmount ?? 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={2} className="px-4 py-3 font-bold text-gray-700 uppercase text-xs">Total</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{totalQty.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
