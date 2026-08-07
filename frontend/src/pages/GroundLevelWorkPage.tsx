import { useEffect, useState, useRef } from "react";
import { useProject, PROJECTS } from "../contexts/ProjectContext";
import { getLogoByName } from "../utils/projectLogo";
import {
  groundLevelWorkService,
  type GroundLevelWorkDto,
  type CreateGroundLevelWorkRequest,
} from "../services/groundLevelWorkService";
import { useDownloadEnabled } from "../components/ViewOnlyWrapper";

const VEHICLE_TYPES = ["HITACHI", "TIPPER"];

interface FormState {
  vehicleType: string;
  startDate: string;
  endDate: string;
  breakdownDays: number;
  rentPerDay: number;
  driverBatthaPerDay: number;
  otherAdvance: number;
  remarks: string;
}

const emptyForm: FormState = {
  vehicleType: "",
  startDate: "",
  endDate: "",
  breakdownDays: 0,
  rentPerDay: 0,
  driverBatthaPerDay: 0,
  otherAdvance: 0,
  remarks: "",
};

function computeDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

function deriveBillMonth(startDate: string): string {
  if (!startDate) return "";
  const d = new Date(startDate);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

function formatBillMonth(bm: string): string {
  if (!bm) return "";
  const [y, m] = bm.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "0.00";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Build PDF filename: Aalaya_Arvindham_GroundWork_Jul-2026_Summary */
function buildPdfName(projectShortName: string, billMonth: string, suffix: string): string {
  const proj = projectShortName.replace(/\s+/g, "_");
  const month = billMonth
    ? formatBillMonth(billMonth).replace(/\s+/g, "-") // "Jul-2026"
    : "All";
  return `${proj}_GroundWork_${month}_${suffix}`;
}

/** Renders HTML in a hidden iframe and triggers the print/save-as-PDF dialog — no new tab.
 *  The `filename` (without .pdf) becomes the document title so browsers default to it when saving. */
function printViaIframe(html: string, filename?: string) {
  if (filename) {
    // Inject/replace <title> so the browser uses it as the default save-as-PDF filename
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${filename}</title>`);
  }
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  // Wait for images/styles to load before printing
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Clean up after dialog closes
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
  // Fallback if onload already fired (some browsers)
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch { /* already printing */ }
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch { /* already removed */ }
    }, 1000);
  }, 500);
}

export default function GroundLevelWorkPage() {
  const { activeProject, setPageProject } = useProject();
  const downloadEnabled = useDownloadEnabled();

  const [entries, setEntries] = useState<GroundLevelWorkDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  // Filtered entries for summary
  const filteredEntries = entries.filter((e) => {
    if (filterFrom && e.startDate < filterFrom) return false;
    if (filterTo && e.endDate > filterTo) return false;
    return true;
  });

  const hitachiEntries = filteredEntries.filter((e) => e.vehicleType === "HITACHI");
  const tipperEntries = filteredEntries.filter((e) => e.vehicleType === "TIPPER");

  function summarize(list: GroundLevelWorkDto[]) {
    return {
      count: list.length,
      totalDays: list.reduce((s, e) => s + (e.numberOfDays || 0), 0),
      workingDays: list.reduce((s, e) => s + (e.totalWorkingDays || 0), 0),
      rentAmount: list.reduce((s, e) => s + (e.rentAmount || 0), 0),
      batthaPaid: list.reduce((s, e) => s + (e.batthaPaid || 0), 0),
      otherAdvance: list.reduce((s, e) => s + (e.otherAdvance || 0), 0),
      netPayable: list.reduce((s, e) => s + (e.totalNetPayable || 0), 0),
    };
  }

  const hitachiSummary = summarize(hitachiEntries);
  const tipperSummary = summarize(tipperEntries);
  const grandSummary = summarize(filteredEntries);

  // Computed values
  const numberOfDays = computeDays(form.startDate, form.endDate);
  const totalWorkingDays = Math.max(0, numberOfDays - (form.breakdownDays || 0));
  const rentAmount = totalWorkingDays * (form.rentPerDay || 0);
  const batthaPaid = totalWorkingDays * (form.driverBatthaPerDay || 0);
  const totalNetPayable = rentAmount - batthaPaid - (form.otherAdvance || 0);
  const billMonth = deriveBillMonth(form.startDate);

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject]);

  function loadEntries() {
    setLoading(true);
    groundLevelWorkService
      .getByProject(activeProject.name)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }

  function handleChange(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditId(null);
    setShowForm(false);
    setError("");
  }

  function handleEdit(entry: GroundLevelWorkDto) {
    setForm({
      vehicleType: entry.vehicleType,
      startDate: entry.startDate,
      endDate: entry.endDate,
      breakdownDays: entry.breakdownDays || 0,
      rentPerDay: entry.rentPerDay || 0,
      driverBatthaPerDay: entry.driverBatthaPerDay || 0,
      otherAdvance: entry.otherAdvance || 0,
      remarks: entry.remarks || "",
    });
    setEditId(entry.id);
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    if (!form.vehicleType || !form.startDate || !form.endDate) {
      setError("Vehicle type, start date, and end date are required.");
      return;
    }
    if (form.otherAdvance && form.otherAdvance > 0 && !form.remarks.trim()) {
      setError("Remarks is required when Any Other Advance Amount is provided.");
      return;
    }
    setSaving(true);
    setError("");
    const req: CreateGroundLevelWorkRequest = {
      vehicleType: form.vehicleType,
      startDate: form.startDate,
      endDate: form.endDate,
      numberOfDays,
      breakdownDays: form.breakdownDays,
      totalWorkingDays,
      rentPerDay: form.rentPerDay,
      rentAmount,
      driverBatthaPerDay: form.driverBatthaPerDay,
      batthaPaid,
      otherAdvance: form.otherAdvance,
      totalNetPayable,
      billMonth,
      projectName: activeProject.name,
      remarks: form.remarks,
    };
    try {
      if (editId) {
        await groundLevelWorkService.update(editId, req);
      } else {
        await groundLevelWorkService.create(req);
      }
      resetForm();
      loadEntries();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await groundLevelWorkService.delete(id);
      setDeleteConfirm(null);
      loadEntries();
    } catch {
      setError("Failed to delete entry");
    }
  }

  function handlePrint(entry: GroundLevelWorkDto) {
    const logoSrc = getLogoByName(entry.projectName || activeProject.name);
    const html = `
      <html>
      <head>
        <title>Ground Level Work - Monthly Bill</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 15px; }
          .header img { max-width: 160px; margin-bottom: 8px; }
          .header h2 { margin: 4px 0; color: #1e40af; font-size: 18px; }
          .header p { margin: 2px 0; color: #555; font-size: 12px; }
          .bill-title { text-align: center; font-size: 16px; font-weight: bold; color: #1e40af; margin: 20px 0; text-decoration: underline; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td { padding: 10px 14px; font-size: 13px; border: 1px solid #d1d5db; }
          .label { background: #f0f4ff; font-weight: 600; width: 35%; color: #1e3a5f; }
          .value { text-align: right; font-size: 14px; }
          .computed { background: #fffbeb; color: #92400e; font-weight: 600; }
          .total-row td { background: #1e40af; color: #fff; font-weight: bold; font-size: 15px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .footer div { text-align: center; }
          .footer .line { border-top: 1px solid #333; padding-top: 4px; margin-top: 40px; min-width: 150px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoSrc}" alt="${entry.projectName}" />
          <h2>${entry.projectName || activeProject.name}</h2>
          <p>Ground Level Work - Monthly Bill</p>
          <p>Bill Month: ${formatBillMonth(entry.billMonth)}</p>
        </div>
        <div class="bill-title">VEHICLE RENT BILL</div>
        <table>
          <tr>
            <td class="label">Type of Vehicle</td>
            <td class="value">${entry.vehicleType}</td>
          </tr>
          <tr>
            <td class="label">Start Date</td>
            <td class="value">${entry.startDate}</td>
          </tr>
          <tr>
            <td class="label">End Date</td>
            <td class="value">${entry.endDate}</td>
          </tr>
          <tr>
            <td class="label">Number of Days</td>
            <td class="value computed">${entry.numberOfDays ?? 0}</td>
          </tr>
          <tr>
            <td class="label">No. of Breakdown Days</td>
            <td class="value">${entry.breakdownDays ?? 0}</td>
          </tr>
          <tr>
            <td class="label">Total Working Days (Net)</td>
            <td class="value computed">${entry.totalWorkingDays ?? 0}</td>
          </tr>
          <tr>
            <td class="label">Rent for 1 Day</td>
            <td class="value">${fmt(entry.rentPerDay)}</td>
          </tr>
          <tr>
            <td class="label">Rent Amount for 1 Month</td>
            <td class="value computed">${fmt(entry.rentAmount)}</td>
          </tr>
          <tr>
            <td class="label">Driver Battha Per Day</td>
            <td class="value">${fmt(entry.driverBatthaPerDay)}</td>
          </tr>
          <tr>
            <td class="label">Battha Paid</td>
            <td class="value computed">${fmt(entry.batthaPaid)}</td>
          </tr>
          <tr>
            <td class="label">Any Other Advance Amount</td>
            <td class="value">${fmt(entry.otherAdvance)}</td>
          </tr>
          <tr class="total-row">
            <td>TOTAL NET PAYABLE</td>
            <td style="text-align:right;font-size:16px;">${fmt(entry.totalNetPayable)}</td>
          </tr>
        </table>
        ${entry.remarks ? `<p style="margin-top:12px;"><strong>Remarks:</strong> ${entry.remarks}</p>` : ""}
        <div class="footer">
          <div><div class="line">Prepared By</div></div>
          <div><div class="line">Verified By</div></div>
          <div><div class="line">Approved By</div></div>
        </div>
      </body>
      </html>`;
    printViaIframe(html, buildPdfName(activeProject.shortName, entry.billMonth, "Bill"));
  }

  function handlePrintSummary() {
    const logoSrc = getLogoByName(activeProject.name);
    const dateRange = filterFrom || filterTo
      ? `${filterFrom || "Start"} to ${filterTo || "Present"}`
      : "All Records";

    const summaryRow = (_label: string, badge: string, badgeBg: string, badgeColor: string, data: ReturnType<typeof summarize>) => `
      <tr>
        <td style="padding:10px 14px;border:1px solid #d1d5db;">
          <span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:600;background:${badgeBg};color:${badgeColor};">${badge}</span>
        </td>
        <td style="padding:10px 14px;border:1px solid #d1d5db;text-align:center;font-weight:500;">${data.count}</td>
        <td style="padding:10px 14px;border:1px solid #d1d5db;text-align:right;">${data.totalDays}</td>
        <td style="padding:10px 14px;border:1px solid #d1d5db;text-align:right;">${data.workingDays}</td>
        <td style="padding:10px 14px;border:1px solid #d1d5db;text-align:right;color:#15803d;font-weight:500;">${fmt(data.rentAmount)}</td>
        <td style="padding:10px 14px;border:1px solid #d1d5db;text-align:right;color:#92400e;">${fmt(data.batthaPaid)}</td>
        <td style="padding:10px 14px;border:1px solid #d1d5db;text-align:right;color:#dc2626;">${fmt(data.otherAdvance)}</td>
        <td style="padding:10px 14px;border:1px solid #d1d5db;text-align:right;color:#1e40af;font-weight:700;">${fmt(data.netPayable)}</td>
      </tr>`;

    const html = `
      <html>
      <head>
        <title>Ground Level Work - Summary</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 15px; }
          .header img { max-width: 160px; margin-bottom: 8px; }
          .header h2 { margin: 4px 0; color: #1e40af; font-size: 18px; }
          .header p { margin: 2px 0; color: #555; font-size: 12px; }
          .title { text-align: center; font-size: 16px; font-weight: bold; color: #1e40af; margin: 20px 0 6px; text-decoration: underline; }
          .date-range { text-align: center; font-size: 12px; color: #555; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th { padding: 10px 14px; background: #f0f4ff; font-weight: 600; color: #1e3a5f; border: 1px solid #d1d5db; font-size: 13px; }
          .grand td { background: #dbeafe; font-weight: 700; color: #1e3a8a; border: 1px solid #93c5fd; font-size: 14px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .footer div { text-align: center; }
          .footer .line { border-top: 1px solid #333; padding-top: 4px; margin-top: 50px; min-width: 150px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoSrc}" alt="${activeProject.name}" />
          <h2>${activeProject.name}</h2>
          <p>Ground Level Work</p>
        </div>
        <div class="title">SUMMARY DASHBOARD</div>
        <div class="date-range">Duration: ${dateRange}</div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Vehicle Type</th>
              <th style="text-align:center;">Bills</th>
              <th style="text-align:right;">Total Days</th>
              <th style="text-align:right;">Working Days</th>
              <th style="text-align:right;">Rent Amount</th>
              <th style="text-align:right;">Battha Paid</th>
              <th style="text-align:right;">Other Advance</th>
              <th style="text-align:right;">Net Payable</th>
            </tr>
          </thead>
          <tbody>
            ${hitachiSummary.count > 0 ? summaryRow("HITACHI", "HITACHI", "#ffedd5", "#9a3412", hitachiSummary) : ""}
            ${tipperSummary.count > 0 ? summaryRow("TIPPER", "TIPPER", "#e0e7ff", "#3730a3", tipperSummary) : ""}
          </tbody>
          <tfoot>
            <tr class="grand">
              <td style="padding:10px 14px;border:1px solid #93c5fd;">GRAND TOTAL</td>
              <td style="padding:10px 14px;border:1px solid #93c5fd;text-align:center;">${grandSummary.count}</td>
              <td style="padding:10px 14px;border:1px solid #93c5fd;text-align:right;">${grandSummary.totalDays}</td>
              <td style="padding:10px 14px;border:1px solid #93c5fd;text-align:right;">${grandSummary.workingDays}</td>
              <td style="padding:10px 14px;border:1px solid #93c5fd;text-align:right;color:#166534;">${fmt(grandSummary.rentAmount)}</td>
              <td style="padding:10px 14px;border:1px solid #93c5fd;text-align:right;color:#92400e;">${fmt(grandSummary.batthaPaid)}</td>
              <td style="padding:10px 14px;border:1px solid #93c5fd;text-align:right;color:#b91c1c;">${fmt(grandSummary.otherAdvance)}</td>
              <td style="padding:10px 14px;border:1px solid #93c5fd;text-align:right;font-size:15px;">${fmt(grandSummary.netPayable)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">
          <div><div class="line">Prepared By</div></div>
          <div><div class="line">Verified By</div></div>
          <div><div class="line">Approved By</div></div>
        </div>
      </body>
      </html>`;
    // For summary, derive a representative bill month from the filter or first entry
    const summaryMonth = filterFrom
      ? deriveBillMonth(filterFrom)
      : filteredEntries.length > 0 ? filteredEntries[0].billMonth : "";
    printViaIframe(html, buildPdfName(activeProject.shortName, summaryMonth, "Summary"));
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e.id)));
    }
  }

  function handlePrintSelected() {
    const selected = entries.filter((e) => selectedIds.has(e.id));
    if (selected.length === 0) return;
    const logoSrc = getLogoByName(activeProject.name);
    const selSummary = summarize(selected);

    const rows = selected.map((e, i) => `
      <tr style="${i % 2 === 1 ? "background:#f9fafb;" : ""}">
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:center;">${i + 1}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${e.vehicleType === "HITACHI" ? "#ffedd5" : "#e0e7ff"};color:${e.vehicleType === "HITACHI" ? "#9a3412" : "#3730a3"};">${e.vehicleType}</span>
        </td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;white-space:nowrap;">${e.startDate} &rarr; ${e.endDate}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:center;">${formatBillMonth(e.billMonth)}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:right;">${e.numberOfDays}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:right;font-weight:500;">${e.totalWorkingDays}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:right;">${fmt(e.rentPerDay)}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:right;color:#15803d;font-weight:500;">${fmt(e.rentAmount)}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:right;color:#92400e;">${fmt(e.batthaPaid)}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:right;color:#dc2626;">${fmt(e.otherAdvance)}</td>
        <td style="padding:8px 12px;border:1px solid #d1d5db;text-align:right;color:#1e40af;font-weight:700;">${fmt(e.totalNetPayable)}</td>
      </tr>`).join("");

    const html = `
      <html>
      <head>
        <title>Ground Level Work - Selected Bills</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 15px; }
          .header img { max-width: 160px; margin-bottom: 8px; }
          .header h2 { margin: 4px 0; color: #1e40af; font-size: 18px; }
          .header p { margin: 2px 0; color: #555; font-size: 12px; }
          .title { text-align: center; font-size: 16px; font-weight: bold; color: #1e40af; margin: 20px 0 6px; text-decoration: underline; }
          .count { text-align: center; font-size: 12px; color: #555; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { padding: 8px 12px; background: #f0f4ff; font-weight: 600; color: #1e3a5f; border: 1px solid #d1d5db; }
          .total td { background: #dbeafe; font-weight: 700; color: #1e3a8a; border: 1px solid #93c5fd; font-size: 13px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .footer div { text-align: center; }
          .footer .line { border-top: 1px solid #333; padding-top: 4px; margin-top: 50px; min-width: 150px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoSrc}" alt="${activeProject.name}" />
          <h2>${activeProject.name}</h2>
          <p>Ground Level Work</p>
        </div>
        <div class="title">SELECTED VEHICLE RENT BILLS</div>
        <div class="count">${selected.length} Bill(s) Selected</div>
        <table>
          <thead>
            <tr>
              <th style="text-align:center;">#</th>
              <th style="text-align:left;">Vehicle</th>
              <th style="text-align:left;">Period</th>
              <th style="text-align:center;">Bill Month</th>
              <th style="text-align:right;">Days</th>
              <th style="text-align:right;">Working</th>
              <th style="text-align:right;">Rent/Day</th>
              <th style="text-align:right;">Rent Amt</th>
              <th style="text-align:right;">Battha</th>
              <th style="text-align:right;">Advance</th>
              <th style="text-align:right;">Net Payable</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr class="total">
              <td style="padding:8px 12px;border:1px solid #93c5fd;" colspan="4">TOTAL (${selected.length} Bills)</td>
              <td style="padding:8px 12px;border:1px solid #93c5fd;text-align:right;">${selSummary.totalDays}</td>
              <td style="padding:8px 12px;border:1px solid #93c5fd;text-align:right;">${selSummary.workingDays}</td>
              <td style="padding:8px 12px;border:1px solid #93c5fd;"></td>
              <td style="padding:8px 12px;border:1px solid #93c5fd;text-align:right;color:#166534;">${fmt(selSummary.rentAmount)}</td>
              <td style="padding:8px 12px;border:1px solid #93c5fd;text-align:right;color:#92400e;">${fmt(selSummary.batthaPaid)}</td>
              <td style="padding:8px 12px;border:1px solid #93c5fd;text-align:right;color:#b91c1c;">${fmt(selSummary.otherAdvance)}</td>
              <td style="padding:8px 12px;border:1px solid #93c5fd;text-align:right;font-size:14px;">${fmt(selSummary.netPayable)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">
          <div><div class="line">Prepared By</div></div>
          <div><div class="line">Verified By</div></div>
          <div><div class="line">Approved By</div></div>
        </div>
      </body>
      </html>`;
    const selMonth = selected.length > 0 ? selected[0].billMonth : "";
    printViaIframe(html, buildPdfName(activeProject.shortName, selMonth, "Selected"));
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ground Level Work</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monthly vehicle rent bills for ground-level construction work
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <select
            value={activeProject.key}
            onChange={(e) => {
              const proj = PROJECTS.find((p) => p.key === e.target.value);
              if (proj) setPageProject(proj);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {PROJECTS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.shortName}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm({ ...emptyForm });
              setError("");
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Bill
          </button>
        </div>
      </div>

      {/* ── Summary Dashboard ── */}
      {entries.length > 0 && (
        <div className="mb-6 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-white font-semibold text-sm">Summary Dashboard</h2>
            <div className="flex items-center gap-2">
              <label className="text-blue-100 text-xs">From</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="px-2 py-1 rounded text-xs border-0 bg-white/90 focus:ring-1 focus:ring-blue-300"
              />
              <label className="text-blue-100 text-xs">To</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="px-2 py-1 rounded text-xs border-0 bg-white/90 focus:ring-1 focus:ring-blue-300"
              />
              {(filterFrom || filterTo) && (
                <button
                  onClick={() => { setFilterFrom(""); setFilterTo(""); }}
                  className="text-blue-100 hover:text-white text-xs underline ml-1"
                >
                  Clear
                </button>
              )}
              {downloadEnabled && (
                <button
                  onClick={handlePrintSummary}
                  className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-medium flex items-center gap-1"
                  title="Print Summary"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Vehicle Type</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-gray-600">Bills</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Total Days</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Working Days</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Rent Amount</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Battha Paid</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Other Advance</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Net Payable</th>
                </tr>
              </thead>
              <tbody>
                {hitachiSummary.count > 0 && (
                  <tr className="border-b hover:bg-orange-50/40">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">HITACHI</span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-medium">{hitachiSummary.count}</td>
                    <td className="px-4 py-2.5 text-right">{hitachiSummary.totalDays}</td>
                    <td className="px-4 py-2.5 text-right">{hitachiSummary.workingDays}</td>
                    <td className="px-4 py-2.5 text-right text-green-700 font-medium">{fmt(hitachiSummary.rentAmount)}</td>
                    <td className="px-4 py-2.5 text-right text-amber-700">{fmt(hitachiSummary.batthaPaid)}</td>
                    <td className="px-4 py-2.5 text-right text-red-600">{fmt(hitachiSummary.otherAdvance)}</td>
                    <td className="px-4 py-2.5 text-right text-blue-700 font-bold">{fmt(hitachiSummary.netPayable)}</td>
                  </tr>
                )}
                {tipperSummary.count > 0 && (
                  <tr className="border-b hover:bg-indigo-50/40">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">TIPPER</span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-medium">{tipperSummary.count}</td>
                    <td className="px-4 py-2.5 text-right">{tipperSummary.totalDays}</td>
                    <td className="px-4 py-2.5 text-right">{tipperSummary.workingDays}</td>
                    <td className="px-4 py-2.5 text-right text-green-700 font-medium">{fmt(tipperSummary.rentAmount)}</td>
                    <td className="px-4 py-2.5 text-right text-amber-700">{fmt(tipperSummary.batthaPaid)}</td>
                    <td className="px-4 py-2.5 text-right text-red-600">{fmt(tipperSummary.otherAdvance)}</td>
                    <td className="px-4 py-2.5 text-right text-blue-700 font-bold">{fmt(tipperSummary.netPayable)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td className="px-4 py-2.5 font-bold text-blue-900">GRAND TOTAL</td>
                  <td className="px-4 py-2.5 text-center font-bold text-blue-900">{grandSummary.count}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-blue-900">{grandSummary.totalDays}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-blue-900">{grandSummary.workingDays}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-green-800">{fmt(grandSummary.rentAmount)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-amber-800">{fmt(grandSummary.batthaPaid)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-red-700">{fmt(grandSummary.otherAdvance)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-blue-900 text-base">{fmt(grandSummary.netPayable)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-blue-50">
              <h2 className="text-lg font-semibold text-blue-900">
                {editId ? "Edit Bill" : "Create Monthly Bill"}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Vehicle *</label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => handleChange("vehicleType", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Vehicle</option>
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Days Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
                  <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-semibold">
                    {numberOfDays}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breakdown Days</label>
                  <input
                    type="number"
                    min={0}
                    value={form.breakdownDays}
                    onChange={(e) => handleChange("breakdownDays", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Days (Net)</label>
                  <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-semibold">
                    {totalWorkingDays}
                  </div>
                </div>
              </div>

              {/* Rent Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rent for 1 Day</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.rentPerDay || ""}
                    onChange={(e) => handleChange("rentPerDay", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter rent per day"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount (1 Month)</label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-800 font-semibold">
                    {fmt(rentAmount)}
                  </div>
                </div>
              </div>

              {/* Battha Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Battha Per Day</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.driverBatthaPerDay || ""}
                    onChange={(e) => handleChange("driverBatthaPerDay", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter battha per day"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Battha Paid</label>
                  <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-semibold">
                    {fmt(batthaPaid)}
                  </div>
                </div>
              </div>

              {/* Other Advance + Remarks in one row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Any Other Advance Amount</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.otherAdvance || ""}
                    onChange={(e) => handleChange("otherAdvance", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter advance amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks {form.otherAdvance > 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={form.remarks}
                    onChange={(e) => handleChange("remarks", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      form.otherAdvance > 0 && !form.remarks.trim() ? "border-red-300 bg-red-50" : ""
                    }`}
                    placeholder={form.otherAdvance > 0 ? "Required — describe the advance" : "Optional remarks"}
                  />
                  {form.otherAdvance > 0 && !form.remarks.trim() && (
                    <p className="text-xs text-red-500 mt-1">Required when advance is provided</p>
                  )}
                </div>
              </div>

              {/* Total Net Payable */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-blue-800 mb-1">Total Net Payable</label>
                <div className="text-2xl font-bold text-blue-900">
                  {fmt(totalNetPayable)}
                </div>
              </div>

              {/* Bill Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill Month (Auto)</label>
                <div className="px-3 py-2 bg-gray-50 border rounded-lg text-gray-600 text-sm">
                  {billMonth ? formatBillMonth(billMonth) : "Set start date to auto-derive"}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow disabled:opacity-50"
              >
                {saving ? "Saving..." : editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Entry?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Entries Table ── */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0H9.75m0 0v3.75m0-3.75H6.75" />
          </svg>
          <p className="text-gray-500 font-medium">No entries yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Create Bill" to add a new vehicle rent entry.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Print Selected Bar */}
          {selectedIds.size > 0 && downloadEnabled && (
            <div className="px-4 py-2 bg-blue-50 border-b flex items-center justify-between">
              <span className="text-sm text-blue-800 font-medium">{selectedIds.size} bill(s) selected</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border rounded"
                >
                  Clear
                </button>
                <button
                  onClick={handlePrintSelected}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Save as PDF
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={entries.length > 0 && selectedIds.size === entries.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Vehicle</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Period</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Bill Month</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Days</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Working</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Rent/Day</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Rent Amt</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Battha</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Advance</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Net Payable</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={entry.id} className={`border-b hover:bg-blue-50/30 ${selectedIds.has(entry.id) ? "bg-blue-50/50" : idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        entry.vehicleType === "HITACHI"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {entry.vehicleType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {entry.startDate} &rarr; {entry.endDate}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatBillMonth(entry.billMonth)}</td>
                    <td className="px-4 py-3 text-right">{entry.numberOfDays}</td>
                    <td className="px-4 py-3 text-right font-medium">{entry.totalWorkingDays}</td>
                    <td className="px-4 py-3 text-right">{fmt(entry.rentPerDay)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{fmt(entry.rentAmount)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{fmt(entry.batthaPaid)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{fmt(entry.otherAdvance)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(entry.totalNetPayable)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        {downloadEnabled && (
                          <button
                            onClick={() => handlePrint(entry)}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                            title="Print"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(entry.id)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td className="px-3 py-3"></td>
                  <td className="px-4 py-3 font-bold text-blue-900" colSpan={3}>GRAND TOTAL ({entries.length} Bills)</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-900">{grandSummary.totalDays}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-900">{grandSummary.workingDays}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-900"></td>
                  <td className="px-4 py-3 text-right font-bold text-green-800">{fmt(grandSummary.rentAmount)}</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-800">{fmt(grandSummary.batthaPaid)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-700">{fmt(grandSummary.otherAdvance)}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-900 text-base">{fmt(grandSummary.netPayable)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Hidden print ref (unused - using iframe approach) */}
      <div ref={printRef} className="hidden" />
    </div>
  );
}
