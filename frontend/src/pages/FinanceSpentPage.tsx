import { useEffect, useState, useRef } from "react";
import { authService } from "../services/authService";
import { financeSpentService } from "../services/financeSpentService";
import type { FinanceSpentDto, CreateFinanceSpentRequest, UserName } from "../services/financeSpentService";
import type { User } from "../types/user";
import api from "../services/api";

/* ═══════════════════════════════════════════
   TYPES & HELPERS
   ═══════════════════════════════════════════ */
interface Project {
  id: number;
  name: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    IN_APPROVAL: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

/* helper: beginning of week (Monday) */
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/* ═══════════════════════════════════════════
   COMBOBOX COMPONENT — select with "Add New" option
   ═══════════════════════════════════════════ */
function ComboBox({
  label,
  required,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [isCustom, setIsCustom] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // If the current value is not in options, show it as custom
  useEffect(() => {
    if (value && options.length > 0 && !options.includes(value)) {
      setIsCustom(true);
    }
  }, [value, options]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  if (isCustom) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => { setIsCustom(false); onChange(""); }}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap"
          >
            Select from list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border rounded-lg text-sm cursor-pointer bg-white flex items-center justify-between"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>{value || placeholder || `Select ${label}`}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1.5 text-sm border rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.map((opt) => (
              <div
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-arcadia-50 ${opt === value ? "bg-arcadia-100 font-medium" : ""}`}
              >
                {opt}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
            )}
          </div>
          {/* Add New */}
          <div
            onClick={() => { setIsCustom(true); setOpen(false); setSearch(""); onChange(""); }}
            className="px-3 py-2 text-sm border-t cursor-pointer hover:bg-blue-50 text-arcadia-600 font-medium"
          >
            + Add New
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
type TabKey = "entry" | "submissions" | "approvals" | "reports";

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function FinanceSpentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("entry");
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userNames, setUserNames] = useState<UserName[]>([]);
  const [paidToOptions, setPaidToOptions] = useState<string[]>([]);
  const [descriptionOptions, setDescriptionOptions] = useState<string[]>([]);

  const userRoles = currentUser?.roles.map((r) => r.name) ?? [];
  const isAdminOrPartner = userRoles.some((r) => ["ADMIN", "PARTNER"].includes(r));
  const canApprove = isAdminOrPartner;
  const canViewReports = userRoles.some((r) => ["ADMIN", "PARTNER", "ACCOUNTS", "ACCOUNTING"].includes(r));

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
    api.get<Project[]>("/projects").then((r) => setProjects(r.data)).catch(() => {});
    financeSpentService.getUserNames().then(setUserNames).catch(() => {});
    financeSpentService.getDistinctPaidTo().then(setPaidToOptions).catch(() => {});
    financeSpentService.getDistinctDescriptions().then(setDescriptionOptions).catch(() => {});
  }, []);

  function refreshDropdownOptions() {
    financeSpentService.getDistinctPaidTo().then(setPaidToOptions).catch(() => {});
    financeSpentService.getDistinctDescriptions().then(setDescriptionOptions).catch(() => {});
  }

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: "entry", label: "New Entry", show: true },
    { key: "submissions", label: "My Submissions", show: true },
    { key: "approvals", label: "Pending Approvals", show: canApprove },
    { key: "reports", label: "Reports", show: canViewReports },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Finance Spent</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === t.key
                  ? "border-arcadia-600 text-arcadia-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {activeTab === "entry" && (
        <EntryTab
          projects={projects}
          userNames={userNames}
          paidToOptions={paidToOptions}
          descriptionOptions={descriptionOptions}
          onSuccess={() => { refreshDropdownOptions(); setActiveTab("submissions"); }}
        />
      )}
      {activeTab === "submissions" && <SubmissionsTab />}
      {activeTab === "approvals" && <ApprovalsTab />}
      {activeTab === "reports" && <ReportsTab projects={projects} />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ENTRY TAB
   ═══════════════════════════════════════════ */
function EntryTab({
  projects,
  userNames,
  paidToOptions,
  descriptionOptions,
  onSuccess,
}: {
  projects: Project[];
  userNames: UserName[];
  paidToOptions: string[];
  descriptionOptions: string[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CreateFinanceSpentRequest>({
    projectName: "",
    spentDate: toISODate(new Date()),
    amount: 0,
    paidBy: "",
    paidTo: "",
    vendorAcknowledgement: "PENDING",
    receiptImageBase64: "",
    description: "",
    remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Build "Who Paid" options from user names
  const whoPaidOptions = userNames.map((u) => u.name);

  function handleChange(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, receiptImageBase64: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectName || !form.paidBy || !form.paidTo || !form.amount) {
      setError("Please fill all required fields");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await financeSpentService.create(form);
      setSuccess("Payment entry submitted successfully!");
      setForm({
        projectName: "",
        spentDate: toISODate(new Date()),
        amount: 0,
        paidBy: "",
        paidTo: "",
        vendorAcknowledgement: "PENDING",
        receiptImageBase64: "",
        description: "",
        remarks: "",
      });
      setImagePreview("");
      setTimeout(() => {
        setSuccess("");
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl shadow-sm border p-6 space-y-4">
      {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{success}</div>}
      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {/* Project */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
        <select value={form.projectName} onChange={(e) => handleChange("projectName", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
        <input type="date" value={form.spentDate} onChange={(e) => handleChange("spentDate", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (Rs) <span className="text-red-500">*</span></label>
        <input type="number" value={form.amount || ""} onChange={(e) => handleChange("amount", Number(e.target.value))} required min={1} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Enter amount" />
      </div>

      {/* Paid By / To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ComboBox
          label="Who Paid"
          required
          value={form.paidBy}
          options={whoPaidOptions}
          placeholder="Select who paid"
          onChange={(v) => handleChange("paidBy", v)}
        />
        <ComboBox
          label="To Whom Paid"
          required
          value={form.paidTo}
          options={paidToOptions}
          placeholder="Select vendor / recipient"
          onChange={(v) => handleChange("paidTo", v)}
        />
      </div>

      {/* Description */}
      <ComboBox
        label="Description"
        value={form.description || ""}
        options={descriptionOptions}
        placeholder="What was this payment for?"
        onChange={(v) => handleChange("description", v)}
      />

      {/* Vendor Acknowledgement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Acknowledgement</label>
        <select value={form.vendorAcknowledgement} onChange={(e) => handleChange("vendorAcknowledgement", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="PENDING">Pending</option>
          <option value="YES">Yes - Acknowledged</option>
          <option value="NO">No - Not Acknowledged</option>
        </select>
      </div>

      {/* Receipt Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Receipt (Image)</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 text-sm border border-arcadia-300 text-arcadia-700 rounded-lg hover:bg-arcadia-50">
            Upload / Capture Receipt
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
          {imagePreview && <span className="text-xs text-green-600">Image attached</span>}
        </div>
        {imagePreview && (
          <div className="mt-2 relative inline-block">
            <img src={imagePreview} alt="Receipt" className="max-h-40 rounded-lg border" />
            <button type="button" onClick={() => { setImagePreview(""); setForm((p) => ({ ...p, receiptImageBase64: "" })); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
          </div>
        )}
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea value={form.remarks || ""} onChange={(e) => handleChange("remarks", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Any additional notes" />
      </div>

      <button type="submit" disabled={saving} className="w-full py-2.5 bg-arcadia-600 text-white rounded-lg font-medium hover:bg-arcadia-700 disabled:opacity-50 transition">
        {saving ? "Submitting..." : "Submit Payment Entry"}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════
   SUBMISSIONS TAB
   ═══════════════════════════════════════════ */
function SubmissionsTab() {
  const [entries, setEntries] = useState<FinanceSpentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    financeSpentService.mySubmissions().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function showReceipt(id: number) {
    setImageError("");
    try {
      const full = await financeSpentService.getById(id);
      if (full.receiptImageBase64) {
        setViewImage(full.receiptImageBase64);
      } else {
        setImageError("No receipt image available for this entry.");
        setTimeout(() => setImageError(""), 3000);
      }
    } catch {
      setImageError("Failed to load receipt. The image may be unavailable.");
      setTimeout(() => setImageError(""), 3000);
    }
  }

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No submissions yet.</p>;

  return (
    <>
      {imageError && (
        <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{imageError}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Project</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Paid By</th>
              <th className="px-3 py-2 text-left">Paid To</th>
              <th className="px-3 py-2 text-center">Vendor Ack</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{formatDate(e.spentDate)}</td>
                <td className="px-3 py-2">{e.projectName}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                <td className="px-3 py-2">{e.paidBy}</td>
                <td className="px-3 py-2">{e.paidTo}</td>
                <td className="px-3 py-2 text-center">{e.vendorAcknowledgement || "-"}</td>
                <td className="px-3 py-2 text-center">{statusBadge(e.status)}</td>
                <td className="px-3 py-2 text-center">
                  {e.hasReceipt ? (
                    <button onClick={() => showReceipt(e.id)} className="text-arcadia-600 hover:underline text-xs">View</button>
                  ) : (
                    <span className="text-gray-300 text-xs">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="Receipt" className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-xl" />
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   APPROVALS TAB
   ═══════════════════════════════════════════ */
function ApprovalsTab() {
  const [entries, setEntries] = useState<FinanceSpentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");

  function refresh() {
    setLoading(true);
    financeSpentService.pendingApprovals().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  async function handleAction() {
    if (!actionId || !actionType) return;
    setSaving(true);
    try {
      await financeSpentService.approve(actionId, actionType, remarks);
      setActionId(null);
      setActionType("");
      setRemarks("");
      refresh();
    } catch { alert("Failed to process"); }
    finally { setSaving(false); }
  }

  async function showReceipt(id: number) {
    setImageError("");
    try {
      const full = await financeSpentService.getById(id);
      if (full.receiptImageBase64) {
        setViewImage(full.receiptImageBase64);
      } else {
        setImageError("No receipt image available for this entry.");
        setTimeout(() => setImageError(""), 3000);
      }
    } catch {
      setImageError("Failed to load receipt. The image may be unavailable.");
      setTimeout(() => setImageError(""), 3000);
    }
  }

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No pending approvals.</p>;

  return (
    <>
      {imageError && (
        <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{imageError}</div>
      )}
      <div className="space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800">{e.projectName} &mdash; {formatCurrency(e.amount)}</p>
                <p className="text-sm text-gray-500 mt-1">{formatDate(e.spentDate)} &middot; Submitted by {e.submittedByName}</p>
                {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
              </div>
              <div className="text-right text-sm space-y-1">
                <p><span className="text-gray-400">Paid By:</span> {e.paidBy}</p>
                <p><span className="text-gray-400">Paid To:</span> {e.paidTo}</p>
                <p><span className="text-gray-400">Vendor Ack:</span> {e.vendorAcknowledgement || "N/A"}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {e.hasReceipt ? (
                <button onClick={() => showReceipt(e.id)} className="px-3 py-1.5 text-xs border text-arcadia-600 rounded-lg hover:bg-arcadia-50">View Receipt</button>
              ) : (
                <span className="px-3 py-1.5 text-xs text-gray-400">No Receipt</span>
              )}
              <button onClick={() => { setActionId(e.id); setActionType("APPROVED"); }} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
              <button onClick={() => { setActionId(e.id); setActionType("REJECTED"); }} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
            </div>
          </div>
        ))}
      </div>

      {/* Approval / Reject Dialog */}
      {actionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-3">{actionType === "APPROVED" ? "Approve" : "Reject"} Entry</h3>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (optional)" rows={3} className="w-full px-3 py-2 border rounded-lg text-sm mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setActionId(null); setRemarks(""); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAction} disabled={saving} className={`px-4 py-2 text-sm text-white rounded-lg ${actionType === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}>
                {saving ? "Processing..." : actionType === "APPROVED" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="Receipt" className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-xl" />
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   REPORTS TAB
   ═══════════════════════════════════════════ */
function ReportsTab({ projects }: { projects: Project[] }) {
  const today = new Date();
  const [mode, setMode] = useState<"day" | "week" | "month">("day");
  const [fromDate, setFromDate] = useState(toISODate(today));
  const [toDate, setToDate] = useState(toISODate(today));
  const [project, setProject] = useState("");
  const [entries, setEntries] = useState<FinanceSpentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [loadingReceipt, setLoadingReceipt] = useState<number | null>(null);

  function applyPreset(m: "day" | "week" | "month") {
    setMode(m);
    const now = new Date();
    if (m === "day") {
      setFromDate(toISODate(now));
      setToDate(toISODate(now));
    } else if (m === "week") {
      setFromDate(toISODate(startOfWeek(now)));
      setToDate(toISODate(now));
    } else {
      setFromDate(toISODate(new Date(now.getFullYear(), now.getMonth(), 1)));
      setToDate(toISODate(now));
    }
  }

  function fetchReport() {
    setLoading(true);
    setReportError("");
    financeSpentService
      .reports(fromDate, toDate, project || undefined)
      .then(setEntries)
      .catch((err: any) => setReportError(err?.response?.data?.message || "Failed to load report. Please try again."))
      .finally(() => setLoading(false));
  }

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
  const approvedCount = entries.filter((e) => e.status === "APPROVED").length;
  const pendingCount = entries.filter((e) => e.status === "PENDING").length;
  const rejectedCount = entries.filter((e) => e.status === "REJECTED").length;

  async function showReceipt(id: number) {
    setImageError("");
    setLoadingReceipt(id);
    try {
      const full = await financeSpentService.getById(id);
      if (full.receiptImageBase64) {
        setViewImage(full.receiptImageBase64);
      } else {
        setImageError("No receipt image available for this entry.");
        setTimeout(() => setImageError(""), 3000);
      }
    } catch {
      setImageError("Failed to load receipt. The image may be unavailable due to a data migration.");
      setTimeout(() => setImageError(""), 4000);
    } finally {
      setLoadingReceipt(null);
    }
  }

  function exportCSV() {
    const header = ["Date", "Project", "Amount", "Paid By", "Paid To", "Description", "Vendor Ack", "Status", "Submitted By"];
    const rows = entries.map((e) => [
      e.spentDate, e.projectName, e.amount, e.paidBy, e.paidTo,
      e.description || "", e.vendorAcknowledgement || "", e.status, e.submittedByName,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex flex-wrap items-end gap-4">
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
            <div className="flex gap-1">
              {(["day", "week", "month"] as const).map((m) => (
                <button key={m} onClick={() => applyPreset(m)} className={`px-3 py-1.5 text-xs rounded-lg border ${mode === m ? "bg-arcadia-600 text-white border-arcadia-600" : "text-gray-600 hover:bg-gray-100"}`}>
                  {m === "day" ? "Today" : m === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setMode("day"); }} className="px-3 py-1.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setMode("day"); }} className="px-3 py-1.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
            <select value={project} onChange={(e) => setProject(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={fetchReport} disabled={loading} className="px-4 py-1.5 bg-arcadia-600 text-white text-sm rounded-lg hover:bg-arcadia-700 disabled:opacity-50">
            {loading ? "Loading..." : "Search"}
          </button>
          <button onClick={exportCSV} disabled={entries.length === 0} className="px-4 py-1.5 border border-green-600 text-green-700 text-sm rounded-lg hover:bg-green-50 disabled:opacity-50">
            Export CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {reportError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {reportError}
        </div>
      )}

      {/* Image Error */}
      {imageError && (
        <div className="px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg">
          {imageError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Total Spent</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Data Table */}
      {entries.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No entries found for the selected period.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Project</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Paid By</th>
                <th className="px-3 py-2 text-left">Paid To</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-center">Vendor Ack</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-left">Submitted By</th>
                <th className="px-3 py-2 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(e.spentDate)}</td>
                  <td className="px-3 py-2">{e.projectName}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                  <td className="px-3 py-2">{e.paidBy}</td>
                  <td className="px-3 py-2">{e.paidTo}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{e.description || "-"}</td>
                  <td className="px-3 py-2 text-center">{e.vendorAcknowledgement || "-"}</td>
                  <td className="px-3 py-2 text-center">{statusBadge(e.status)}</td>
                  <td className="px-3 py-2">{e.submittedByName}</td>
                  <td className="px-3 py-2 text-center">
                    {e.hasReceipt ? (
                      <button
                        onClick={() => showReceipt(e.id)}
                        disabled={loadingReceipt === e.id}
                        className="text-arcadia-600 hover:underline text-xs disabled:opacity-50"
                      >
                        {loadingReceipt === e.id ? "Loading..." : "View"}
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-3 py-2" colSpan={2}>Total ({entries.length} entries)</td>
                <td className="px-3 py-2 text-right">{formatCurrency(totalAmount)}</td>
                <td colSpan={7}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="Receipt" className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-xl" />
        </div>
      )}
    </div>
  );
}
