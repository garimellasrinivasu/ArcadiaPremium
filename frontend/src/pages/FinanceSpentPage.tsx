import { useEffect, useState, useRef, useCallback } from "react";
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

function formatDateTime(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    + " " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
  };
  const labels: Record<string, string> = {
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    PAID: "Paid",
    PENDING: "Pending",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/* ═══════════════════════════════════════════
   COMBOBOX COMPONENT
   ═══════════════════════════════════════════ */
function ComboBox({
  label, required, value, options, placeholder, onChange,
}: {
  label: string; required?: boolean; value: string; options: string[];
  placeholder?: string; onChange: (v: string) => void;
}) {
  const [isCustom, setIsCustom] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && options.length > 0 && !options.includes(value)) setIsCustom(true);
  }, [value, options]);

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
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} required={required}
            className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder={placeholder} />
          <button type="button" onClick={() => { setIsCustom(false); onChange(""); }}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 whitespace-nowrap">
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
      <div className="flex gap-2">
        <div onClick={() => setOpen(!open)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm cursor-pointer bg-white flex items-center justify-between">
          <span className={value ? "text-gray-800" : "text-gray-400"}>{value || placeholder || `Select ${label}`}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        <button type="button" onClick={() => { setIsCustom(true); onChange(""); }}
          className="px-3 py-2 text-xs border border-arcadia-300 rounded-lg text-arcadia-600 hover:bg-arcadia-50 whitespace-nowrap font-medium">
          + Add New
        </button>
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="w-full px-2 py-1.5 text-sm border rounded" autoFocus onClick={(e) => e.stopPropagation()} />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.map((opt) => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-arcadia-50 ${opt === value ? "bg-arcadia-100 font-medium" : ""}`}>
                {opt}
              </div>
            ))}
            {filtered.length === 0 && options.length > 0 && <div className="px-3 py-2 text-sm text-gray-400">No matches</div>}
            {options.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No options yet. Click "+ Add New" to enter a value.</div>}
          </div>
          <div onClick={() => { setIsCustom(true); setOpen(false); setSearch(""); onChange(""); }}
            className="px-3 py-2 text-sm border-t cursor-pointer hover:bg-blue-50 text-arcadia-600 font-medium">
            + Add New
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CAMERA / RECEIPT CAPTURE COMPONENT
   ═══════════════════════════════════════════ */
function ReceiptCapture({
  imagePreview, onCapture, onClear,
}: {
  imagePreview: string; onCapture: (base64: string) => void; onClear: () => void;
}) {
  type ReceiptMode = "camera" | "upload";
  const [receiptMode, setReceiptMode] = useState<ReceiptMode>("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      video.play().catch(console.error);
    }
  }, [cameraActive]);

  async function startCamera() {
    setCameraError("");
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 960 } },
        });
      }
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError("Camera access denied or not available. Please allow camera access or use Upload mode.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera not ready yet. Please wait a moment and try again.");
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(base64);
    stopCamera();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onCapture(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleModeSwitch(mode: ReceiptMode) {
    stopCamera();
    setReceiptMode(mode);
    setCameraError("");
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Receipt (Image)</label>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1 w-fit">
        <button type="button" onClick={() => handleModeSwitch("camera")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${receiptMode === "camera" ? "bg-white text-arcadia-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          📷 Capture
        </button>
        <button type="button" onClick={() => handleModeSwitch("upload")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${receiptMode === "upload" ? "bg-white text-arcadia-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          📁 Upload
        </button>
      </div>

      {/* Camera Mode */}
      {receiptMode === "camera" && !imagePreview && (
        <div className="space-y-3">
          {cameraError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{cameraError}</div>}
          {!cameraActive ? (
            <button type="button" onClick={startCamera}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-2 border-dashed border-arcadia-300 text-arcadia-700 rounded-xl hover:bg-arcadia-50 hover:border-arcadia-400 transition w-full justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open Camera to Capture Receipt
            </button>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden border-2 border-arcadia-300 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-64 object-cover" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={capturePhoto}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
                  Capture
                </button>
                <button type="button" onClick={stopCamera}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Upload Mode */}
      {receiptMode === "upload" && !imagePreview && (
        <div>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-2 border-dashed border-arcadia-300 text-arcadia-700 rounded-xl hover:bg-arcadia-50 hover:border-arcadia-400 transition w-full justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Choose File to Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mt-2">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Receipt" className="max-h-48 rounded-xl border-2 border-green-300 shadow-sm" />
            <button type="button" onClick={() => { onClear(); stopCamera(); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow hover:bg-red-600 transition">
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-green-600 font-medium">Receipt image attached</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
type TabKey = "newRequest" | "makePayment" | "myRequests" | "approvals" | "reports";

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function FinanceSpentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("newRequest");
  const [payNowId, setPayNowId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userNames, setUserNames] = useState<UserName[]>([]);
  const [paidToOptions, setPaidToOptions] = useState<string[]>([]);
  const [descriptionOptions, setDescriptionOptions] = useState<string[]>([]);

  const userRole = currentUser?.role?.name ?? "";
  const isAdminOrPartner = ["ADMIN", "PARTNER"].includes(userRole);
  const canApprove = isAdminOrPartner;
  const canViewReports = ["ADMIN", "PARTNER", "ACCOUNTS", "ACCOUNTING"].includes(userRole);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
    api.get<Project[]>("/projects/active").then((r) => setProjects(r.data)).catch(() => {});
    financeSpentService.getUserNames().then(setUserNames).catch(() => {});
    financeSpentService.getDistinctPaidTo().then(setPaidToOptions).catch(() => {});
    financeSpentService.getDistinctDescriptions().then(setDescriptionOptions).catch(() => {});
  }, []);

  function refreshDropdownOptions() {
    financeSpentService.getDistinctPaidTo().then(setPaidToOptions).catch(() => {});
    financeSpentService.getDistinctDescriptions().then(setDescriptionOptions).catch(() => {});
  }

  const tabs: { key: TabKey; label: string; icon: string; show: boolean }[] = [
    { key: "newRequest", label: "New Request", icon: "📝", show: true },
    { key: "makePayment", label: "Make Payment", icon: "💰", show: true },
    { key: "myRequests", label: "My Requests", icon: "📋", show: true },
    { key: "approvals", label: "Approvals", icon: "✅", show: canApprove },
    { key: "reports", label: "Reports", icon: "📊", show: canViewReports },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Finance Spent</h2>

      {/* Workflow indicator */}
      <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <strong>Workflow:</strong> New Request → Authority Approval → Make Payment (with Receipt)
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === t.key
                  ? "border-arcadia-600 text-arcadia-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
      </div>

      {activeTab === "newRequest" && (
        <NewRequestTab
          projects={projects}
          userNames={userNames}
          paidToOptions={paidToOptions}
          descriptionOptions={descriptionOptions}
          onSuccess={() => { refreshDropdownOptions(); setActiveTab("myRequests"); }}
        />
      )}
      {activeTab === "makePayment" && (
        <MakePaymentTab
          key={payNowId ? `pay-${payNowId}` : "pay"}
          autoSelectId={payNowId}
          onClearAutoSelect={() => setPayNowId(null)}
        />
      )}
      {activeTab === "myRequests" && (
        <MyRequestsTab onGoToPayment={(id: number) => { setPayNowId(id); setActiveTab("makePayment"); }} />
      )}
      {activeTab === "approvals" && <ApprovalsTab />}
      {activeTab === "reports" && <ReportsTab projects={projects} />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   STAGE 1: NEW REQUEST TAB
   Creates a payment request (no receipt needed)
   ═══════════════════════════════════════════ */
function NewRequestTab({
  projects, userNames, paidToOptions, descriptionOptions, onSuccess,
}: {
  projects: Project[]; userNames: UserName[]; paidToOptions: string[];
  descriptionOptions: string[]; onSuccess: () => void;
}) {
  const [form, setForm] = useState<CreateFinanceSpentRequest>({
    projectName: "",
    spentDate: toISODate(new Date()),
    amount: 0,
    paidBy: "",
    paidTo: "",
    vendorAcknowledgement: "PENDING",
    description: "",
    remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const whoPaidOptions = userNames.map((u) => u.name);

  function handleChange(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      const result = await financeSpentService.create(form);
      setSuccess(`Payment request ${result.requestNumber || ""} submitted for approval!`);
      setForm({
        projectName: "", spentDate: toISODate(new Date()), amount: 0,
        paidBy: "", paidTo: "", vendorAcknowledgement: "PENDING", description: "", remarks: "",
      });
      setTimeout(() => { setSuccess(""); onSuccess(); }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="pb-3 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Create Payment Request</h3>
        <p className="text-sm text-gray-500 mt-1">Submit a request for payment approval. No receipt needed at this stage.</p>
      </div>

      {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{success}</div>}
      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {/* Project */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
        <select value={form.projectName} onChange={(e) => handleChange("projectName", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Project</option>
          {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>

      {/* Date & Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Spent Date <span className="text-red-500">*</span></label>
          <input type="date" value={form.spentDate} onChange={(e) => handleChange("spentDate", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs) <span className="text-red-500">*</span></label>
          <input type="number" value={form.amount || ""} onChange={(e) => handleChange("amount", Number(e.target.value))} required min={1} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Enter amount" />
        </div>
      </div>

      {/* Paid By / To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ComboBox label="Who Paid" required value={form.paidBy} options={whoPaidOptions} placeholder="Select who paid" onChange={(v) => handleChange("paidBy", v)} />
        <ComboBox label="To Whom Paid" required value={form.paidTo} options={paidToOptions} placeholder="Select vendor / recipient" onChange={(v) => handleChange("paidTo", v)} />
      </div>

      {/* Description */}
      <ComboBox label="Description" value={form.description || ""} options={descriptionOptions} placeholder="What is this payment for?" onChange={(v) => handleChange("description", v)} />

      {/* Remarks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea value={form.remarks || ""} onChange={(e) => handleChange("remarks", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Any additional notes" />
      </div>

      <button type="submit" disabled={saving} className="w-full py-2.5 bg-arcadia-600 text-white rounded-lg font-medium hover:bg-arcadia-700 disabled:opacity-50 transition">
        {saving ? "Submitting..." : "Submit Payment Request for Approval"}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════
   STAGE 3: MAKE PAYMENT TAB
   Shows approved requests; user pays & uploads receipt
   ═══════════════════════════════════════════ */
function MakePaymentTab({
  autoSelectId, onClearAutoSelect,
}: {
  autoSelectId?: number | null;
  onClearAutoSelect?: () => void;
}) {
  const [entries, setEntries] = useState<FinanceSpentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(autoSelectId ?? null);
  const [receiptImage, setReceiptImage] = useState("");
  const [paymentDate, setPaymentDate] = useState(toISODate(new Date()));
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [vendorAck, setVendorAck] = useState("YES");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function refresh() {
    setLoading(true);
    financeSpentService.approvedForPayment().then(setEntries).catch(() => setEntries([])).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  const selected = entries.find((e) => e.id === selectedId);

  async function handleMarkPaid(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    if (!receiptImage) {
      setError("Please capture or upload a receipt image");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await financeSpentService.markPaid(selectedId, {
        receiptImageBase64: receiptImage,
        paymentDate,
        paymentRemarks,
        vendorAcknowledgement: vendorAck,
      });
      setSuccess("Payment marked as PAID successfully!");
      setSelectedId(null);
      setReceiptImage("");
      setPaymentRemarks("");
      setVendorAck("YES");
      refresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to mark as paid");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400 text-center py-12">Loading approved requests...</p>;

  // No approved transactions at all
  if (entries.length === 0) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center py-8">
            <div className="text-5xl mb-4 opacity-60">📭</div>
            <p className="text-gray-600 text-lg font-medium">No Approved Transactions</p>
            <p className="text-gray-400 text-sm mt-2">There are no approved payment requests available for payment right now.</p>
            <p className="text-gray-400 text-sm mt-1">Once your requests are approved by the authority, they will appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{success}</div>}
      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        <div className="pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Make Payment</h3>
          <p className="text-sm text-gray-500 mt-1">Select an approved transaction to make payment and upload receipt.</p>
        </div>

        {/* Step 1: Select approved transaction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Approved Transaction <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedId ?? ""}
            onChange={(e) => { setSelectedId(e.target.value ? Number(e.target.value) : null); setReceiptImage(""); setError(""); onClearAutoSelect?.(); }}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">-- Select Transaction --</option>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.requestNumber || `#${e.id}`} — {e.projectName} — {formatCurrency(e.amount)} — {e.paidTo}
              </option>
            ))}
          </select>
        </div>

        {/* Selected transaction details */}
        {selected && (
          <>
            <div className="bg-arcadia-50 rounded-lg p-4 border border-arcadia-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-arcadia-700">{selected.requestNumber || `#${selected.id}`}</span>
                {statusBadge(selected.status)}
              </div>
              <p className="font-semibold text-gray-800">{selected.projectName} — {formatCurrency(selected.amount)}</p>
              <p className="text-sm text-gray-500 mt-1">Paid By: {selected.paidBy} → To: {selected.paidTo}</p>
              {selected.description && <p className="text-sm text-gray-600 mt-1">{selected.description}</p>}
              <p className="text-xs text-gray-500 mt-2">Requested: {selected.createdAt ? formatDateTime(selected.createdAt) : "—"}</p>
              <p className="text-xs text-gray-500">Approved by {selected.approvedByName} on {selected.approvedAt ? formatDate(selected.approvedAt) : "—"}</p>
            </div>

            {/* Payment form — only visible after selecting a transaction */}
            <form onSubmit={handleMarkPaid} className="space-y-4">
              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              {/* Receipt */}
              <ReceiptCapture
                imagePreview={receiptImage}
                onCapture={setReceiptImage}
                onClear={() => setReceiptImage("")}
              />

              {/* Vendor Acknowledgement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Acknowledgement</label>
                <select value={vendorAck} onChange={(e) => setVendorAck(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="YES">Yes - Acknowledged</option>
                  <option value="NO">No - Not Acknowledged</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              {/* Payment Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Remarks</label>
                <textarea value={paymentRemarks} onChange={(e) => setPaymentRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Any notes about the payment" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition">
                {saving ? "Processing..." : "Mark as Paid & Upload Receipt"}
              </button>
            </form>
          </>
        )}

        {/* Prompt when no transaction selected */}
        {!selected && (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">Please select an approved transaction above to proceed with payment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MY REQUESTS TAB — all statuses
   ═══════════════════════════════════════════ */
function MyRequestsTab({ onGoToPayment }: { onGoToPayment: (id: number) => void }) {
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
      if (full.receiptImageBase64) setViewImage(full.receiptImageBase64);
      else { setImageError("No receipt image available."); setTimeout(() => setImageError(""), 3000); }
    } catch { setImageError("Failed to load receipt."); setTimeout(() => setImageError(""), 3000); }
  }

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No requests submitted yet.</p>;

  // Summary counts
  const counts = {
    total: entries.length,
    pending: entries.filter((e) => e.status === "PENDING_APPROVAL").length,
    approved: entries.filter((e) => e.status === "APPROVED").length,
    paid: entries.filter((e) => e.status === "PAID").length,
    rejected: entries.filter((e) => e.status === "REJECTED").length,
  };

  return (
    <>
      {imageError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{imageError}</div>}

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Total: {counts.total}</span>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending: {counts.pending}</span>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Approved: {counts.approved}</span>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid: {counts.paid}</span>
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected: {counts.rejected}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Req #</th>
              <th className="px-3 py-2 text-left">Requested At</th>
              <th className="px-3 py-2 text-left">Spent Date</th>
              <th className="px-3 py-2 text-left">Project</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Paid By</th>
              <th className="px-3 py-2 text-left">Paid To</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-left">Approver</th>
              <th className="px-3 py-2 text-center">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs text-arcadia-700">{e.requestNumber || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{e.createdAt ? formatDateTime(e.createdAt) : "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(e.spentDate)}</td>
                <td className="px-3 py-2">{e.projectName}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                <td className="px-3 py-2">{e.paidBy}</td>
                <td className="px-3 py-2">{e.paidTo}</td>
                <td className="px-3 py-2 text-center">{statusBadge(e.status)}</td>
                <td className="px-3 py-2 text-sm">
                  {e.approvedByName ? (
                    <span>{e.approvedByName}{e.approverRemarks ? <span className="text-gray-400 text-xs ml-1">({e.approverRemarks})</span> : ""}</span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  {e.hasReceipt ? (
                    <button onClick={() => showReceipt(e.id)} className="text-arcadia-600 hover:underline text-xs">View</button>
                  ) : e.status === "APPROVED" ? (
                    <button onClick={() => onGoToPayment(e.id)} className="text-green-600 hover:underline text-xs font-semibold">Pay Now →</button>
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
   STAGE 2: APPROVALS TAB (for authority users)
   ═══════════════════════════════════════════ */
function ApprovalsTab() {
  const [entries, setEntries] = useState<FinanceSpentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

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

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No pending approvals.</p>;

  return (
    <>
      <div className="space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-arcadia-700">{e.requestNumber || "—"}</p>
                <p className="font-semibold text-gray-800 mt-1">{e.projectName} — {formatCurrency(e.amount)}</p>
                <p className="text-sm text-gray-500 mt-1">{formatDate(e.spentDate)} &middot; Submitted by {e.submittedByName}</p>
                <p className="text-xs text-gray-400 mt-0.5">Requested: {e.createdAt ? formatDateTime(e.createdAt) : "—"}</p>
                {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
                {e.remarks && <p className="text-xs text-gray-500 mt-1 italic">Remarks: {e.remarks}</p>}
              </div>
              <div className="text-right text-sm space-y-1">
                <p><span className="text-gray-400">Paid By:</span> {e.paidBy}</p>
                <p><span className="text-gray-400">To:</span> {e.paidTo}</p>
                <div className="mt-2">{statusBadge(e.status)}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => { setActionId(e.id); setActionType("APPROVED"); }} className="px-4 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Approve</button>
              <button onClick={() => { setActionId(e.id); setActionType("REJECTED"); }} className="px-4 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Reject</button>
            </div>
          </div>
        ))}
      </div>

      {/* Approval / Reject Dialog */}
      {actionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-3">{actionType === "APPROVED" ? "Approve" : "Reject"} Request</h3>
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
    if (m === "day") { setFromDate(toISODate(now)); setToDate(toISODate(now)); }
    else if (m === "week") { setFromDate(toISODate(startOfWeek(now))); setToDate(toISODate(now)); }
    else { setFromDate(toISODate(new Date(now.getFullYear(), now.getMonth(), 1))); setToDate(toISODate(now)); }
  }

  function fetchReport() {
    setLoading(true);
    setReportError("");
    financeSpentService.reports(fromDate, toDate, project || undefined)
      .then(setEntries)
      .catch((err: any) => setReportError(err?.response?.data?.message || "Failed to load report."))
      .finally(() => setLoading(false));
  }

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
  const paidCount = entries.filter((e) => e.status === "PAID").length;
  const approvedCount = entries.filter((e) => e.status === "APPROVED").length;
  const pendingCount = entries.filter((e) => e.status === "PENDING_APPROVAL").length;
  const rejectedCount = entries.filter((e) => e.status === "REJECTED").length;

  async function showReceipt(id: number) {
    setImageError("");
    setLoadingReceipt(id);
    try {
      const full = await financeSpentService.getById(id);
      if (full.receiptImageBase64) setViewImage(full.receiptImageBase64);
      else { setImageError("No receipt image available."); setTimeout(() => setImageError(""), 3000); }
    } catch { setImageError("Failed to load receipt."); setTimeout(() => setImageError(""), 3000); }
    finally { setLoadingReceipt(null); }
  }

  function exportCSV() {
    const header = ["Req #", "Requested At", "Spent Date", "Project", "Amount", "Paid By", "Paid To", "Description", "Vendor Ack", "Status", "Payment Date", "Submitted By", "Approved By"];
    const rows = entries.map((e) => [
      e.requestNumber || "", e.createdAt ? formatDateTime(e.createdAt) : "", e.spentDate, e.projectName, e.amount, e.paidBy, e.paidTo,
      e.description || "", e.vendorAcknowledgement || "", e.status, e.paymentDate || "", e.submittedByName, e.approvedByName || "",
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

      {reportError && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{reportError}</div>}
      {imageError && <div className="px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg">{imageError}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Total</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Paid</p>
          <p className="text-xl font-bold text-green-600 mt-1">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Approved</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Pending</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Rejected</p>
          <p className="text-xl font-bold text-red-600 mt-1">{rejectedCount}</p>
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
                <th className="px-3 py-2 text-left">Req #</th>
                <th className="px-3 py-2 text-left">Requested At</th>
                <th className="px-3 py-2 text-left">Spent Date</th>
                <th className="px-3 py-2 text-left">Project</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Paid By</th>
                <th className="px-3 py-2 text-left">Paid To</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-left">Submitted By</th>
                <th className="px-3 py-2 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs text-arcadia-700">{e.requestNumber || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{e.createdAt ? formatDateTime(e.createdAt) : "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(e.spentDate)}</td>
                  <td className="px-3 py-2">{e.projectName}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                  <td className="px-3 py-2">{e.paidBy}</td>
                  <td className="px-3 py-2">{e.paidTo}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{e.description || "—"}</td>
                  <td className="px-3 py-2 text-center">{statusBadge(e.status)}</td>
                  <td className="px-3 py-2">{e.submittedByName}</td>
                  <td className="px-3 py-2 text-center">
                    {e.hasReceipt ? (
                      <button onClick={() => showReceipt(e.id)} disabled={loadingReceipt === e.id}
                        className="text-arcadia-600 hover:underline text-xs disabled:opacity-50">
                        {loadingReceipt === e.id ? "..." : "View"}
                      </button>
                    ) : <span className="text-gray-300 text-xs">N/A</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-3 py-2" colSpan={4}>Total ({entries.length} entries)</td>
                <td className="px-3 py-2 text-right">{formatCurrency(totalAmount)}</td>
                <td colSpan={6}></td>
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
