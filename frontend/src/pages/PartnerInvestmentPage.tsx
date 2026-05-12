import { useEffect, useState, useRef, useCallback } from "react";
import { authService } from "../services/authService";
import { partnerInvestmentService } from "../services/partnerInvestmentService";
import type { PartnerInvestmentDto, CreatePartnerInvestmentRequest } from "../services/partnerInvestmentService";
import type { User } from "../types/user";
import api from "../services/api";

/* ═══════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════ */
const ALL_PARTNERS = ["Prakash N", "Suresh Kumar K", "Srinivasu Garimella"];
const PROJECTS = ["Praneeth Arcadia Premium", "Praneeth Redfern Square", "Aalaya Arvindham", "Kalpavruksha Developers"];
const PAYMENT_MODES = ["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"];
const PURPOSES = ["LAND", "CONSTRUCTION", "MATERIAL", "LABOUR", "LEGAL", "REGISTRATION", "OTHER"];

/** Project-specific partner mapping (must match backend) */
const PROJECT_PARTNERS: Record<string, string[]> = {
  "Kalpavruksha Developers": ["Prakash N", "Srinivasu Garimella"],
};
function getProjectPartners(projectName: string): string[] {
  return PROJECT_PARTNERS[projectName] || ALL_PARTNERS;
}

interface Project { id: number; name: string; }

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function toISODate(d: Date) { return d.toISOString().slice(0, 10); }

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

function approvalDots(entry: PartnerInvestmentDto) {
  const projectPartners = getProjectPartners(entry.projectName);
  const approvals = [
    { name: ALL_PARTNERS[0], approved: entry.partner1Approved },
    { name: ALL_PARTNERS[1], approved: entry.partner2Approved },
    { name: ALL_PARTNERS[2], approved: entry.partner3Approved },
  ].filter(p => projectPartners.some(pp => pp.toLowerCase() === p.name.toLowerCase()));
  return (
    <div className="flex gap-1">
      {approvals.map((a, i) => (
        <span key={i} className={`w-3 h-3 rounded-full ${a.approved ? "bg-green-500" : "bg-gray-300"}`} title={`${a.name}: ${a.approved ? "Approved" : "Pending"}`} />
      ))}
    </div>
  );
}

/** Flexible matching: check if createdByName corresponds to a given partner */
function isCreatorPartner(createdByName: string | undefined, partnerName: string): boolean {
  if (!createdByName) return false;
  const lower = createdByName.toLowerCase().trim();
  const pLower = partnerName.toLowerCase();
  if (lower === pLower) return true;
  // Partial match
  if (pLower.includes("prakash") && lower.includes("prakash")) return true;
  if (pLower.includes("suresh") && lower.includes("suresh")) return true;
  if (pLower.includes("garimella") && (lower.includes("garimella") || lower.includes("srinivas"))) return true;
  if (pLower.includes("srinivasu") && (lower.includes("garimella") || lower.includes("srinivas"))) return true;
  return false;
}

/** Get per-partner approval status text for display */
function getApprovalLines(entry: PartnerInvestmentDto): { name: string; status: string; isCreator: boolean; inProject: boolean }[] {
  const projectPartners = getProjectPartners(entry.projectName);
  return [
    { name: ALL_PARTNERS[0], approved: entry.partner1Approved, approvedAt: entry.partner1ApprovedAt },
    { name: ALL_PARTNERS[1], approved: entry.partner2Approved, approvedAt: entry.partner2ApprovedAt },
    { name: ALL_PARTNERS[2], approved: entry.partner3Approved, approvedAt: entry.partner3ApprovedAt },
  ].map(p => {
    const inProject = projectPartners.some(pp => pp.toLowerCase() === p.name.toLowerCase());
    const isCreator = isCreatorPartner(entry.createdByName, p.name);
    let status = "Pending";
    if (!inProject) {
      status = "N/A";
    } else if (p.approved && isCreator) {
      status = "Auto-approved (Creator)";
    } else if (p.approved) {
      status = p.approvedAt ? `Approved on ${formatDate(p.approvedAt)}` : "Approved";
    }
    return { name: p.name, status, isCreator, inProject };
  });
}

/* ═══════════════════════════════════════════
   SIGNATURE PAD COMPONENT
   ═══════════════════════════════════════════ */
function SignaturePad({ onSave, onCancel }: { onSave: (sig: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [hasDrawn, setHasDrawn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function getCtx() { return canvasRef.current?.getContext("2d"); }

  function getPos(e: React.TouchEvent | React.MouseEvent): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
    }
    return [(e as React.MouseEvent).clientX - rect.left, (e as React.MouseEvent).clientY - rect.top];
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    setDrawing(true);
    setHasDrawn(true);
    const [x, y] = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const [x, y] = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDraw() { setDrawing(false); }

  function clearCanvas() {
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  }

  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function saveDrawn() {
    if (!canvasRef.current) return;
    onSave(canvasRef.current.toDataURL("image/png"));
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onSave(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border p-5 w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-3">Add Your Signature</h3>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMode("draw")} className={`px-3 py-1.5 text-xs rounded-lg border ${mode === "draw" ? "bg-arcadia-600 text-white" : "text-gray-600"}`}>Draw Signature</button>
        <button onClick={() => setMode("upload")} className={`px-3 py-1.5 text-xs rounded-lg border ${mode === "upload" ? "bg-arcadia-600 text-white" : "text-gray-600"}`}>Upload Image</button>
      </div>

      {mode === "draw" ? (
        <>
          <div className="border-2 border-dashed border-gray-300 rounded-lg mb-3 touch-none">
            <canvas
              ref={canvasRef}
              width={380}
              height={150}
              className="w-full cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={clearCanvas} className="px-3 py-1.5 text-xs border rounded-lg text-gray-600 hover:bg-gray-100">Clear</button>
            <button onClick={saveDrawn} disabled={!hasDrawn} className="px-4 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Save Signature</button>
            <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-3">
            <button onClick={() => fileRef.current?.click()} className="px-4 py-2 text-sm border border-arcadia-300 text-arcadia-700 rounded-lg hover:bg-arcadia-50">
              Choose Signature Image
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </div>
          <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PRINTABLE DOCUMENT COMPONENT
   ═══════════════════════════════════════════ */
function PrintableDocument({ entry, onClose }: { entry: PartnerInvestmentDto; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Investment Agreement - ${entry.projectName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; color: #1a1a1a; }
        .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 30px; }
        .header img.logo { max-height: 80px; margin-bottom: 10px; }
        .header h1 { font-size: 22px; margin: 0; letter-spacing: 1px; }
        .header h2 { font-size: 16px; margin: 5px 0; color: #555; }
        .header p { font-size: 12px; color: #777; margin: 3px 0; }
        .section { margin-bottom: 20px; }
        .section h3 { font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        td { padding: 6px 10px; font-size: 13px; vertical-align: top; }
        td:first-child { font-weight: bold; width: 180px; color: #555; }
        .amount { font-size: 20px; font-weight: bold; }
        .signatures { display: flex; justify-content: space-around; margin-top: 60px; page-break-inside: avoid; }
        .sig-block { text-align: center; width: 45%; }
        .sig-block.three-col { width: 30%; }
        .sig-block .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
        .sig-block .sig-name { font-weight: bold; font-size: 13px; }
        .sig-block .sig-label { font-size: 11px; color: #777; }
        .sig-block img { max-height: 60px; margin-bottom: -55px; }
        .status-badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .approved { background: #d4edda; color: #155724; }
        .pending { background: #fff3cd; color: #856404; }
        .na { background: #f0f0f0; color: #999; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { body { margin: 20px; } .no-print { display: none; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h3 className="font-semibold">Investment Agreement Document</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700">Print / Save PDF</button>
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Close</button>
          </div>
        </div>

        {/* Document */}
        <div ref={printRef} className="p-8">
          <div className="header">
            <img className="logo" src="/arcadia-logo.png" alt="Logo" />
            <h1>PARTNER INVESTMENT AGREEMENT</h1>
            <h2>{entry.projectName}</h2>
            <p>Date: {formatDate(entry.investmentDate)} &nbsp;|&nbsp; Ref: PI-{String(entry.id).padStart(4, "0")}</p>
          </div>

          <div className="section">
            <h3>Investment Details</h3>
            <table>
              <tbody>
                <tr><td>Investing Partner</td><td>{entry.partnerName}</td></tr>
                <tr><td>Project</td><td>{entry.projectName}</td></tr>
                <tr><td>Investment Date</td><td>{formatDate(entry.investmentDate)}</td></tr>
                <tr><td>Amount</td><td className="amount">{formatCurrency(entry.amount)}</td></tr>
                <tr><td>Purpose</td><td>{entry.purpose || "—"}</td></tr>
                <tr><td>Description</td><td>{entry.description || "—"}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3>Payment Information</h3>
            <table>
              <tbody>
                <tr><td>Payment Mode</td><td>{entry.paymentMode}</td></tr>
                {entry.bankName && <tr><td>Bank Name</td><td>{entry.bankName}</td></tr>}
                {entry.accountDetails && <tr><td>Account Details</td><td>{entry.accountDetails}</td></tr>}
                {entry.transactionId && <tr><td>Transaction ID</td><td>{entry.transactionId}</td></tr>}
                {entry.referenceNo && <tr><td>Reference No</td><td>{entry.referenceNo}</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3>Approval Status</h3>
            <p style={{ fontSize: "13px", marginBottom: "10px" }}>
              Status: <span className={`status-badge ${entry.status === "APPROVED" ? "approved" : "pending"}`}>{entry.status}</span>
            </p>
            <table>
              <tbody>
                {getApprovalLines(entry).filter(l => l.inProject).map(l => (
                  <tr key={l.name}><td>{l.name}</td><td>{l.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {entry.remarks && (
            <div className="section">
              <h3>Remarks</h3>
              <p style={{ fontSize: "13px" }}>{entry.remarks}</p>
            </div>
          )}

          {/* Signature Blocks — only project-relevant partners */}
          {(() => {
            const projectPartners = getProjectPartners(entry.projectName);
            const sigData = ALL_PARTNERS.map((name, i) => ({
              name,
              sig: i === 0 ? entry.partner1Signature : i === 1 ? entry.partner2Signature : entry.partner3Signature,
              inProject: projectPartners.some(pp => pp.toLowerCase() === name.toLowerCase()),
            })).filter(s => s.inProject);
            const colClass = sigData.length === 3 ? "sig-block three-col" : "sig-block";
            return (
              <div className="signatures">
                {sigData.map(s => (
                  <div key={s.name} className={colClass}>
                    {s.sig ? <img src={s.sig} alt={`${s.name} signature`} /> : <div style={{ height: 60 }} />}
                    <div className="sig-line">
                      <div className="sig-name">{s.name}</div>
                      <div className="sig-label">Partner</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="footer">
            <p>This document is generated by ArcadiaPremium &mdash; Partner Investment Management System</p>
            <p>Generated on: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
type TabKey = "entry" | "submissions" | "pending" | "approved";

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function PartnerInvestmentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("entry");
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
    api.get<Project[]>("/projects").then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "entry", label: "New Entry" },
    { key: "submissions", label: "My Submissions" },
    { key: "pending", label: "Pending Approvals" },
    { key: "approved", label: "Approved" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Partner Investment</h2>
      <div className="flex gap-1 border-b mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === t.key ? "border-arcadia-600 text-arcadia-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "entry" && <EntryTab projects={projects} onSuccess={() => setActiveTab("submissions")} />}
      {activeTab === "submissions" && <SubmissionsTab />}
      {activeTab === "pending" && <PendingTab currentUser={currentUser} />}
      {activeTab === "approved" && <ApprovedTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ENTRY TAB
   ═══════════════════════════════════════════ */
function EntryTab({ projects, onSuccess }: { projects: Project[]; onSuccess: () => void }) {
  const [form, setForm] = useState<CreatePartnerInvestmentRequest>({
    projectName: "",
    partnerName: "",
    investmentDate: toISODate(new Date()),
    amount: 0,
    paymentMode: "",
    referenceNo: "",
    bankName: "",
    accountDetails: "",
    transactionId: "",
    description: "",
    purpose: "",
    receiptImageBase64: "",
    remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Merge project list with fixed PROJECTS
  const allProjects = [...new Set([...PROJECTS, ...projects.map((p) => p.name)])];

  function handleChange(key: string, value: string | number) {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      // When project changes, clear partner if they're not in the new project
      if (key === "projectName") {
        const newPartners = getProjectPartners(value as string);
        if (!newPartners.includes(prev.partnerName)) {
          updated.partnerName = "";
        }
      }
      return updated;
    });
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
    if (!form.projectName || !form.partnerName || !form.amount || !form.paymentMode) {
      setError("Please fill all required fields");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await partnerInvestmentService.create(form);
      setSuccess("Investment entry submitted for partner approval!");
      setForm({ projectName: "", partnerName: "", investmentDate: toISODate(new Date()), amount: 0, paymentMode: "", referenceNo: "", bankName: "", accountDetails: "", transactionId: "", description: "", purpose: "", receiptImageBase64: "", remarks: "" });
      setImagePreview("");
      setTimeout(() => { setSuccess(""); onSuccess(); }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl shadow-sm border p-6 space-y-4">
      {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{success}</div>}
      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
          <select value={form.projectName} onChange={(e) => handleChange("projectName", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Project</option>
            {allProjects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Investing Partner <span className="text-red-500">*</span></label>
          <select value={form.partnerName} onChange={(e) => handleChange("partnerName", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Partner</option>
            {getProjectPartners(form.projectName || "").map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
          <input type="date" value={form.investmentDate} onChange={(e) => handleChange("investmentDate", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs) <span className="text-red-500">*</span></label>
          <input type="number" value={form.amount || ""} onChange={(e) => handleChange("amount", Number(e.target.value))} required min={1} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode <span className="text-red-500">*</span></label>
          <select value={form.paymentMode} onChange={(e) => handleChange("paymentMode", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Mode</option>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
          <select value={form.purpose || ""} onChange={(e) => handleChange("purpose", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Purpose</option>
            {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <input type="text" value={form.bankName || ""} onChange={(e) => handleChange("bankName", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Bank name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Details</label>
          <input type="text" value={form.accountDetails || ""} onChange={(e) => handleChange("accountDetails", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Account number" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
          <input type="text" value={form.transactionId || ""} onChange={(e) => handleChange("transactionId", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Transaction/UTR number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
          <input type="text" value={form.referenceNo || ""} onChange={(e) => handleChange("referenceNo", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cheque / Reference number" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input type="text" value={form.description || ""} onChange={(e) => handleChange("description", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="What is this investment for?" />
      </div>

      {/* Receipt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Receipt</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 text-sm border border-arcadia-300 text-arcadia-700 rounded-lg hover:bg-arcadia-50">Upload Receipt</button>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea value={form.remarks || ""} onChange={(e) => handleChange("remarks", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>

      <button type="submit" disabled={saving} className="w-full py-2.5 bg-arcadia-600 text-white rounded-lg font-medium hover:bg-arcadia-700 disabled:opacity-50 transition">
        {saving ? "Submitting..." : "Submit for Partner Approval"}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════
   SUBMISSIONS TAB
   ═══════════════════════════════════════════ */
function SubmissionsTab() {
  const [entries, setEntries] = useState<PartnerInvestmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<PartnerInvestmentDto | null>(null);

  useEffect(() => {
    partnerInvestmentService.mySubmissions().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const viewDocument = useCallback(async (id: number) => {
    try {
      const full = await partnerInvestmentService.getById(id);
      setViewDoc(full);
    } catch { /* ignore */ }
  }, []);

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No submissions yet.</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Project</th>
              <th className="px-3 py-2 text-left">Partner</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-center">Approvals</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{formatDate(e.investmentDate)}</td>
                <td className="px-3 py-2">{e.projectName}</td>
                <td className="px-3 py-2">{e.partnerName}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                <td className="px-3 py-2 text-center">{approvalDots(e)}</td>
                <td className="px-3 py-2 text-center">{statusBadge(e.status)}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => viewDocument(e.id)} className="text-arcadia-600 hover:underline text-xs">View Document</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewDoc && <PrintableDocument entry={viewDoc} onClose={() => setViewDoc(null)} />}
    </>
  );
}

/* ═══════════════════════════════════════════
   PENDING APPROVALS TAB
   ═══════════════════════════════════════════ */
function PendingTab({ currentUser }: { currentUser: User | null }) {
  const [entries, setEntries] = useState<PartnerInvestmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [viewDoc, setViewDoc] = useState<PartnerInvestmentDto | null>(null);

  function refresh() {
    setLoading(true);
    partnerInvestmentService.pending().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  const currentUserName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "";
  const currentUserEmail = currentUser?.email?.toLowerCase() || "";

  // Identify which partner the current user is (matching backend logic)
  function getPartnerIndex(): number {
    if (!currentUser) return -1;
    const lower = currentUserName.toLowerCase().trim();
    const email = currentUserEmail;

    // Exact name match
    for (let i = 0; i < ALL_PARTNERS.length; i++) {
      if (ALL_PARTNERS[i].toLowerCase().trim() === lower) return i;
    }
    // Partial name / email match
    if (lower.includes("prakash") || email.includes("prakash")) return 0;
    if (lower.includes("suresh") || email.includes("suresh")) return 1;
    if (lower.includes("srinivas") || lower.includes("garimella") || email.includes("garimella") || email.includes("srinivas")) return 2;
    return -1;
  }

  function hasAlreadyApproved(entry: PartnerInvestmentDto): boolean {
    const idx = getPartnerIndex();
    if (idx === 0) return !!entry.partner1Approved;
    if (idx === 1) return !!entry.partner2Approved;
    if (idx === 2) return !!entry.partner3Approved;
    return false;
  }

  async function handleApprove(signature: string) {
    if (!signingId) return;
    setProcessing(true);
    try {
      await partnerInvestmentService.approve(signingId, signature);
      setSigningId(null);
      refresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve");
    } finally { setProcessing(false); }
  }

  const viewDocument = useCallback(async (id: number) => {
    try {
      const full = await partnerInvestmentService.getById(id);
      setViewDoc(full);
    } catch { /* ignore */ }
  }, []);

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No pending approvals.</p>;

  const partnerIdx = getPartnerIndex();

  return (
    <>
      <div className="space-y-4">
        {entries.map((e) => {
          const alreadyApproved = hasAlreadyApproved(e);
          return (
            <div key={e.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{e.projectName} &mdash; {formatCurrency(e.amount)}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(e.investmentDate)} &middot; {e.partnerName} &middot; {e.paymentMode.replace("_", " ")}</p>
                  {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
                  {e.purpose && <p className="text-xs text-gray-400 mt-1">Purpose: {e.purpose}</p>}
                </div>
                <div className="text-right">
                  <div className="mb-2">{approvalDots(e)}</div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    {getApprovalLines(e).filter(l => l.inProject).map(l => (
                      <p key={l.name}>{l.name}: <span className={l.status === "Pending" ? "text-yellow-600 font-medium" : "text-green-600"}>{l.status}</span></p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={() => viewDocument(e.id)} className="px-3 py-1.5 text-xs border text-arcadia-600 rounded-lg hover:bg-arcadia-50">View Document</button>
                {partnerIdx >= 0 && !alreadyApproved && (
                  <button onClick={() => setSigningId(e.id)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Sign & Approve
                  </button>
                )}
                {alreadyApproved && (
                  <span className="px-3 py-1.5 text-xs text-green-600 font-medium">You have approved</span>
                )}
                {partnerIdx < 0 && (
                  <span className="px-3 py-1.5 text-xs text-gray-400">Only partners can approve</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Signature Modal */}
      {signingId && !processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <SignaturePad onSave={handleApprove} onCancel={() => setSigningId(null)} />
        </div>
      )}

      {viewDoc && <PrintableDocument entry={viewDoc} onClose={() => setViewDoc(null)} />}
    </>
  );
}

/* ═══════════════════════════════════════════
   APPROVED TAB
   ═══════════════════════════════════════════ */
function ApprovedTab() {
  const [entries, setEntries] = useState<PartnerInvestmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<PartnerInvestmentDto | null>(null);

  useEffect(() => {
    partnerInvestmentService.approved().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const viewDocument = useCallback(async (id: number) => {
    try {
      const full = await partnerInvestmentService.getById(id);
      setViewDoc(full);
    } catch { /* ignore */ }
  }, []);

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No approved entries yet.</p>;

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Total Approved Investments</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Total Entries</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{entries.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Projects</p>
          <p className="text-2xl font-bold text-arcadia-600 mt-1">{new Set(entries.map((e) => e.projectName)).size}</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Project</th>
              <th className="px-3 py-2 text-left">Partner</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Purpose</th>
              <th className="px-3 py-2 text-center">Document</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{formatDate(e.investmentDate)}</td>
                <td className="px-3 py-2">{e.projectName}</td>
                <td className="px-3 py-2">{e.partnerName}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                <td className="px-3 py-2 text-gray-600">{e.purpose || "—"}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => viewDocument(e.id)} className="text-arcadia-600 hover:underline text-xs">Print / PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-3 py-2" colSpan={3}>Total ({entries.length} entries)</td>
              <td className="px-3 py-2 text-right">{formatCurrency(totalAmount)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {viewDoc && <PrintableDocument entry={viewDoc} onClose={() => setViewDoc(null)} />}
    </>
  );
}
