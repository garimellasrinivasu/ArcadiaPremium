import { useState, useEffect } from "react";
import {
  attendanceReportService,
  type AttendanceReportDto,
} from "../services/attendanceReportService";

type ReportView = "site" | "date" | "detail";

export default function AttendanceReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [siteName, setSiteName] = useState("");
  const [siteNames, setSiteNames] = useState<string[]>([]);
  const [report, setReport] = useState<AttendanceReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<ReportView>("site");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    attendanceReportService.getSiteNames().then(setSiteNames).catch(() => {});
    // Auto-load report on mount
    fetchReport();
  }, []);

  async function fetchReport() {
    if (!fromDate || !toDate) return;
    try {
      setLoading(true);
      setError("");
      const data = await attendanceReportService.getReport(fromDate, toDate, siteName || undefined);
      setReport(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "excel" | "pdf") {
    if (!fromDate || !toDate) return;
    try {
      setExporting(true);
      if (format === "excel") {
        await attendanceReportService.downloadExcel(fromDate, toDate, siteName || undefined);
      } else {
        await attendanceReportService.downloadPdf(fromDate, toDate, siteName || undefined);
      }
    } catch (e: any) {
      setError("Export failed: " + (e.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  }

  // Quick date range presets
  function setPreset(preset: string) {
    const now = new Date();
    let from: Date;
    switch (preset) {
      case "today":
        from = now;
        break;
      case "week":
        from = new Date(now.getTime() - 7 * 86400000);
        break;
      case "month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      default:
        return;
    }
    setFromDate(from.toISOString().split("T")[0]);
    setToDate(now.toISOString().split("T")[0]);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-arcadia-800">Attendance Reports</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        {/* Quick presets */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-500 self-center mr-1">Quick:</span>
          {[
            { key: "today", label: "Today" },
            { key: "week", label: "Last 7 Days" },
            { key: "month", label: "This Month" },
            { key: "quarter", label: "This Quarter" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-600 hover:bg-arcadia-50 hover:border-arcadia-300 hover:text-arcadia-700 transition"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Site</label>
            <select
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500"
            >
              <option value="">All Sites</option>
              {siteNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full bg-arcadia-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("excel")}
              disabled={exporting || !report}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting || !report}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <StatCard label="Total Records" value={report.totalRecords} color="bg-blue-50 text-blue-700 border-blue-200" />
            <StatCard label="Total Workers" value={report.totalWorkers} color="bg-green-50 text-green-700 border-green-200" />
            <StatCard label="M-Mastri" value={report.totalMaleMastri} color="bg-indigo-50 text-indigo-700 border-indigo-200" />
            <StatCard label="F-Mastri" value={report.totalFemaleMastri} color="bg-pink-50 text-pink-700 border-pink-200" />
            <StatCard label="M-Helper" value={report.totalMaleHelper} color="bg-purple-50 text-purple-700 border-purple-200" />
            <StatCard label="F-Helper" value={report.totalFemaleHelper} color="bg-rose-50 text-rose-700 border-rose-200" />
            <StatCard label="Working Days" value={report.totalDays} color="bg-amber-50 text-amber-700 border-amber-200" />
          </div>

          {/* View toggles */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {(["site", "date", "detail"] as ReportView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  view === v ? "bg-white shadow text-arcadia-700" : "text-gray-500 hover:bg-gray-200"
                }`}
              >
                {v === "site" ? "Site Summary" : v === "date" ? "Date Summary" : "Detail Records"}
              </button>
            ))}
          </div>

          {/* Tables */}
          {view === "site" && <SiteSummaryTable data={report} />}
          {view === "date" && <DateSummaryTable data={report} />}
          {view === "detail" && <DetailTable data={report} />}
        </>
      )}

      {!report && !loading && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl text-gray-300 mb-4">&#128202;</div>
          <p className="text-gray-500 text-lg">Attendance Reports</p>
          <p className="text-sm text-gray-400 mt-1">
            Select a date range and click "Generate Report" to view site-wise and date-wise summaries.
          </p>
          <p className="text-xs text-gray-400 mt-1">Only approved attendance records are included.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

function SiteSummaryTable({ data }: { data: AttendanceReportDto }) {
  if (data.siteSummaries.length === 0) {
    return <p className="text-center py-8 text-gray-400 bg-white rounded-xl border">No data found.</p>;
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Site Name</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Records</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Total Workers</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">M-Mastri</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">F-Mastri</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">M-Helper</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">F-Helper</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Days</th>
            </tr>
          </thead>
          <tbody>
            {data.siteSummaries.map((s, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{s.siteName}</td>
                <td className="px-4 py-3 text-right">{s.totalRecords}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">{s.totalWorkers}</td>
                <td className="px-4 py-3 text-right">{s.totalMaleMastri}</td>
                <td className="px-4 py-3 text-right">{s.totalFemaleMastri}</td>
                <td className="px-4 py-3 text-right">{s.totalMaleHelper}</td>
                <td className="px-4 py-3 text-right">{s.totalFemaleHelper}</td>
                <td className="px-4 py-3 text-right">{s.totalDays}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-yellow-50 font-bold border-t-2 border-gray-300">
            <tr>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3 text-right">{data.totalRecords}</td>
              <td className="px-4 py-3 text-right text-green-700">{data.totalWorkers}</td>
              <td className="px-4 py-3 text-right">{data.totalMaleMastri}</td>
              <td className="px-4 py-3 text-right">{data.totalFemaleMastri}</td>
              <td className="px-4 py-3 text-right">{data.totalMaleHelper}</td>
              <td className="px-4 py-3 text-right">{data.totalFemaleHelper}</td>
              <td className="px-4 py-3 text-right">{data.totalDays}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function DateSummaryTable({ data }: { data: AttendanceReportDto }) {
  if (data.dateSummaries.length === 0) {
    return <p className="text-center py-8 text-gray-400 bg-white rounded-xl border">No data found.</p>;
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Sites</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Records</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Total Workers</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">M-Mastri</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">F-Mastri</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">M-Helper</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">F-Helper</th>
            </tr>
          </thead>
          <tbody>
            {data.dateSummaries.map((d, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium">
                  {new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "short", day: "2-digit", month: "short", year: "numeric"
                  })}
                </td>
                <td className="px-4 py-3 text-right">{d.siteCount}</td>
                <td className="px-4 py-3 text-right">{d.totalRecords}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">{d.totalWorkers}</td>
                <td className="px-4 py-3 text-right">{d.totalMaleMastri}</td>
                <td className="px-4 py-3 text-right">{d.totalFemaleMastri}</td>
                <td className="px-4 py-3 text-right">{d.totalMaleHelper}</td>
                <td className="px-4 py-3 text-right">{d.totalFemaleHelper}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-yellow-50 font-bold border-t-2 border-gray-300">
            <tr>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right">{data.totalRecords}</td>
              <td className="px-4 py-3 text-right text-green-700">{data.totalWorkers}</td>
              <td className="px-4 py-3 text-right">{data.totalMaleMastri}</td>
              <td className="px-4 py-3 text-right">{data.totalFemaleMastri}</td>
              <td className="px-4 py-3 text-right">{data.totalMaleHelper}</td>
              <td className="px-4 py-3 text-right">{data.totalFemaleHelper}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function DetailTable({ data }: { data: AttendanceReportDto }) {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");

  if (data.records.length === 0) {
    return <p className="text-center py-8 text-gray-400 bg-white rounded-xl border">No data found.</p>;
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">#</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-700">Photo</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Date</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Captured At</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Site</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Submitted By</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">Total</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">M-Mastri</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">F-Mastri</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">M-Helper</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">F-Helper</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Remarks</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Approved By</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((r, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2 text-center">
                  {r.imageBase64 ? (
                    <button
                      onClick={() => {
                        setModalImage(r.imageBase64);
                        setModalTitle(`${r.siteName} - ${new Date(r.attendanceDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`);
                      }}
                      className="inline-block rounded-lg overflow-hidden border-2 border-gray-200 hover:border-arcadia-400 transition cursor-pointer shadow-sm hover:shadow-md"
                      title="Click to enlarge"
                    >
                      <img
                        src={r.imageBase64}
                        alt="Site attendance"
                        className="w-14 h-14 object-cover"
                      />
                    </button>
                  ) : (
                    <span className="text-gray-300 text-xl" title="No photo">&#128247;</span>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {new Date(r.attendanceDate + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric"
                  })}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-500">
                  {r.capturedAt ? new Date(r.capturedAt).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
                  }) : "-"}
                </td>
                <td className="px-3 py-2.5">{r.siteName}</td>
                <td className="px-3 py-2.5">{r.submittedByName}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{r.totalWorkers}</td>
                <td className="px-3 py-2.5 text-right">{r.maleMastriCount}</td>
                <td className="px-3 py-2.5 text-right">{r.femaleMastriCount}</td>
                <td className="px-3 py-2.5 text-right">{r.maleHelperCount}</td>
                <td className="px-3 py-2.5 text-right">{r.femaleHelperCount}</td>
                <td className="px-3 py-2.5 text-gray-500 max-w-[200px] truncate">{r.remarks || "-"}</td>
                <td className="px-3 py-2.5">{r.approverName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t px-4 py-2 bg-gray-50 text-xs text-gray-500">
        Showing {data.records.length} record{data.records.length !== 1 ? "s" : ""}
      </div>

      {/* Image Modal */}
      {modalImage && (
        <ReportImageModal
          imageSrc={modalImage}
          title={modalTitle}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  IMAGE MODAL                                                       */
/* ------------------------------------------------------------------ */

function ReportImageModal({
  imageSrc,
  title,
  onClose,
}: {
  imageSrc: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 truncate">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2 transition"
            title="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-4 flex items-center justify-center bg-gray-100">
          <img
            src={imageSrc}
            alt={title}
            className="max-w-full max-h-[75vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
