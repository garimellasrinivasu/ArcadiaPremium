import { useState, useEffect } from "react";
import { subcontractingReportService } from "../services/subcontractingReportService";
import api from "../services/api";

interface ContractorOption { id: number; name: string; }

const formatCurrency = (val: number) =>
  "₹" + (val ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ContractorBillReportPage() {
  const [contractors, setContractors] = useState<ContractorOption[]>([]);
  const [contractorId, setContractorId] = useState<number | undefined>();
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
      const result = await subcontractingReportService.getContractorBillReport(contractorId);
      setData(result);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setData([]);
    }
    setLoading(false);
  };

  const totals = data.reduce(
    (acc, r) => ({
      totalBills: acc.totalBills + (r.totalBills ?? 0),
      totalBilledAmount: acc.totalBilledAmount + (r.totalBilledAmount ?? 0),
      totalPaid: acc.totalPaid + (r.totalPaid ?? 0),
      balance: acc.balance + (r.balance ?? 0),
    }),
    { totalBills: 0, totalBilledAmount: 0, totalPaid: 0, balance: 0 }
  );

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Contractor Bill Report</h1>

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
        <div className="text-center py-10 text-gray-400">Select a contractor and click Generate Report.</div>
      ) : loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No bill data found for the selected contractor.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contractor Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Bills</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Billed Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Paid</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.contractorName || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.totalBills ?? 0}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(r.totalBilledAmount ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-green-700 font-semibold">{formatCurrency(r.totalPaid ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-semibold">{formatCurrency(r.balance ?? 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-4 py-3 font-bold text-gray-700 uppercase text-xs">Total</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{totals.totalBills}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(totals.totalBilledAmount)}</td>
                <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(totals.totalPaid)}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(totals.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
