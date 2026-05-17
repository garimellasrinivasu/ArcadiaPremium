import { useEffect, useState } from "react";
import { walkInService } from "../services/walkInService";
import type { WalkInDto, CreateWalkInRequest, DashboardStats } from "../services/walkInService";
import { projectService } from "../services/projectService";
import { authService } from "../services/authService";
import type { User } from "../types/user";

const SOURCE_OPTIONS = [
  "Entrance Board", "Hoarding", "Walk-in", "IVR-MCube-Offline", "PPC",
  "Social Media", "Old Lead", "Referral", "Newspaper Ad", "Broker",
  "Channel Partner", "Other",
];
const CUSTOMER_PROFILES = ["Salaried", "Business", "NRI", "Investor", "Other"];
const PLOT_SIZES = ["150 Sq.Yds", "167 Sq.Yds", "200 Sq.Yds", "250 Sq.Yds", "300 Sq.Yds", "350+ Sq.Yds"];
const BUDGET_RANGES = ["Under 80L", "80L-1Cr", "1-1.5Cr", "1.5-2Cr", "2-3Cr", "Above 3Cr"];
const FACING_OPTIONS = ["East", "West", "North", "South", "Corner", "No Preference"];
const PAYMENT_MODES = ["Cash", "Loan", "Both"];
const STATUS_OPTIONS = ["HOT", "WARM", "COLD", "CONVERTED", "LOST"] as const;

const STATUS_COLORS: Record<string, string> = {
  HOT: "bg-red-500 text-white",
  WARM: "bg-amber-500 text-white",
  COLD: "bg-blue-500 text-white",
  CONVERTED: "bg-green-500 text-white",
  LOST: "bg-gray-500 text-white",
};
const STATUS_HEX: Record<string, string> = {
  HOT: "#ef4444",
  WARM: "#f59e0b",
  COLD: "#3b82f6",
  CONVERTED: "#22c55e",
  LOST: "#6b7280",
};

const today = () => new Date().toISOString().split("T")[0];

const emptyForm: CreateWalkInRequest = {
  visitDate: today(),
  visitorName: "",
  phone: "",
  email: "",
  source: "",
  sourceDetails: "",
  projectName: "",
  plotSizeInterested: "",
  budgetRange: "",
  facingPreference: "",
  customerProfile: "",
  paymentMode: "",
  prospect: false,
  status: "WARM",
  nextFollowUpDate: "",
  remarks: "",
  followUp1: "",
  followUp2: "",
  followUp3: "",
  handledBy: "",
};

type TabKey = "form" | "list" | "dashboard";

export default function WalkInsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("form");
  const [form, setForm] = useState<CreateWalkInRequest>({ ...emptyForm });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // List state
  const [walkIns, setWalkIns] = useState<WalkInDto[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [followUpWalkIn, setFollowUpWalkIn] = useState<WalkInDto | null>(null);
  const [followUpForm, setFollowUpForm] = useState({ status: "", nextFollowUpDate: "", remarks: "", followUp1: "", followUp2: "", followUp3: "" });
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [lastCreated, setLastCreated] = useState<WalkInDto | null>(null);

  // Dashboard state
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashFrom, setDashFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dashTo, setDashTo] = useState(today());
  const [dashProject, setDashProject] = useState("");

  // Shared
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    projectService.getActiveProjects().then((ps) => setProjectNames(ps.map((p) => p.name))).catch(() => {});
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  // Load list when switching to list tab
  useEffect(() => {
    if (activeTab === "list") loadList();
    if (activeTab === "dashboard") loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadList = async () => {
    setListLoading(true);
    try {
      const data = await walkInService.getAll();
      setWalkIns(data);
    } catch { setError("Failed to load walk-ins"); }
    setListLoading(false);
  };

  const loadDashboard = async () => {
    setDashLoading(true);
    try {
      const data = await walkInService.getDashboard(dashFrom, dashTo, dashProject || undefined);
      setDashStats(data);
    } catch { setError("Failed to load dashboard"); }
    setDashLoading(false);
  };

  const isAdmin = currentUser?.role?.name === "ADMIN";
  const isPartner = currentUser?.role?.name === "PARTNER";
  const canDelete = isAdmin || isPartner;

  // ─── Form Handlers ───
  const setField = (key: keyof CreateWalkInRequest, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.visitorName.trim() || !form.phone.trim() || !form.handledBy.trim()) {
      setError("Visitor Name, Mobile Number, and Handled By are required.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const updated = await walkInService.update(editId, form);
        setSuccess("Walk-in updated successfully!");
        setLastCreated(updated);
      } else {
        const created = await walkInService.create(form);
        setSuccess("Walk-in created successfully!");
        setLastCreated(created);
      }
      setForm({ ...emptyForm });
      setEditId(null);
    } catch {
      setError(editId ? "Failed to update walk-in." : "Failed to create walk-in.");
    }
    setSaving(false);
  };

  const startEdit = (w: WalkInDto) => {
    setForm({
      visitDate: w.visitDate?.split("T")[0] || today(),
      visitorName: w.visitorName,
      phone: w.phone,
      email: w.email || "",
      source: w.source,
      sourceDetails: w.sourceDetails || "",
      projectName: w.projectName,
      plotSizeInterested: w.plotSizeInterested || "",
      budgetRange: w.budgetRange || "",
      facingPreference: w.facingPreference || "",
      customerProfile: w.customerProfile || "",
      paymentMode: w.paymentMode || "",
      prospect: w.prospect,
      status: w.status,
      nextFollowUpDate: w.nextFollowUpDate?.split("T")[0] || "",
      remarks: w.remarks || "",
      followUp1: w.followUp1 || "",
      followUp2: w.followUp2 || "",
      followUp3: w.followUp3 || "",
      handledBy: w.handledBy,
    });
    setEditId(w.id);
    setActiveTab("form");
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number) => {
    try {
      await walkInService.delete(id);
      setWalkIns((prev) => prev.filter((w) => w.id !== id));
      setDeleteConfirmId(null);
      setSuccess("Walk-in deleted.");
    } catch {
      setError("Failed to delete walk-in.");
    }
  };

  // ─── Follow-Up Modal Handlers ───
  const openFollowUp = (w: WalkInDto) => {
    setFollowUpWalkIn(w);
    setFollowUpForm({
      status: w.status,
      nextFollowUpDate: w.nextFollowUpDate?.split("T")[0] || "",
      remarks: w.remarks || "",
      followUp1: w.followUp1 || "",
      followUp2: w.followUp2 || "",
      followUp3: w.followUp3 || "",
    });
  };

  const handleFollowUpSave = async () => {
    if (!followUpWalkIn) return;
    setFollowUpSaving(true);
    try {
      const req: CreateWalkInRequest = {
        visitDate: followUpWalkIn.visitDate?.split("T")[0] || today(),
        visitorName: followUpWalkIn.visitorName,
        phone: followUpWalkIn.phone,
        email: followUpWalkIn.email || "",
        source: followUpWalkIn.source,
        sourceDetails: followUpWalkIn.sourceDetails || "",
        projectName: followUpWalkIn.projectName,
        plotSizeInterested: followUpWalkIn.plotSizeInterested || "",
        budgetRange: followUpWalkIn.budgetRange || "",
        facingPreference: followUpWalkIn.facingPreference || "",
        customerProfile: followUpWalkIn.customerProfile || "",
        paymentMode: followUpWalkIn.paymentMode || "",
        prospect: followUpWalkIn.prospect,
        handledBy: followUpWalkIn.handledBy,
        status: followUpForm.status,
        nextFollowUpDate: followUpForm.nextFollowUpDate,
        remarks: followUpForm.remarks,
        followUp1: followUpForm.followUp1,
        followUp2: followUpForm.followUp2,
        followUp3: followUpForm.followUp3,
      };
      const updated = await walkInService.update(followUpWalkIn.id, req);
      setWalkIns((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setLastCreated(updated);
      setFollowUpWalkIn(null);
      setSuccess("Follow-up updated successfully!");
    } catch {
      setError("Failed to update follow-up.");
    }
    setFollowUpSaving(false);
  };

  // ─── Filtered list ───
  const filteredWalkIns = walkIns.filter((w) => {
    if (filterProject && w.projectName !== filterProject) return false;
    if (filterStatus && w.status !== filterStatus) return false;
    if (filterFrom && w.visitDate < filterFrom) return false;
    if (filterTo && w.visitDate > filterTo) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!w.visitorName.toLowerCase().includes(q) && !w.phone.includes(q)) return false;
    }
    return true;
  });

  // ─── Tab buttons ───
  const tabBtn = (key: TabKey, label: string) => (
    <button
      key={key}
      onClick={() => { setActiveTab(key); setError(""); setSuccess(""); }}
      className={`px-5 py-2 rounded-t-lg text-sm font-medium transition-colors ${
        activeTab === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  // ─── Status Badge ───
  const statusBadge = (status: string) => (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status] || "bg-gray-200 text-gray-800"}`}>
      {status}
    </span>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Walk-In Management</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-0">
        {tabBtn("form", editId ? "Edit Walk-In" : "New Walk-In")}
        {tabBtn("list", "Walk-ins List")}
        {tabBtn("dashboard", "Dashboard")}
      </div>

      {/* Messages */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mt-4 text-sm">{success}</div>}

      {/* ═══════════ TAB 1: FORM ═══════════ */}
      {activeTab === "form" && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-4">
          {/* Last Created / Updated Entry Card */}
          {lastCreated && !editId && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Last Entry: {lastCreated.visitorName} ({lastCreated.phone})
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  {lastCreated.projectName} &middot; {lastCreated.source} &middot; {statusBadge(lastCreated.status)}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openFollowUp(lastCreated)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors">
                  Add Follow-Up
                </button>
                <button onClick={() => startEdit(lastCreated)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors">
                  Edit Full Entry
                </button>
                <button onClick={() => setLastCreated(null)}
                  className="text-gray-400 hover:text-gray-600 px-2 text-lg">&times;</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Basic Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Enquiry</label>
                <input type="date" value={form.visitDate} onChange={(e) => setField("visitDate", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Visitor Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.visitorName} onChange={(e) => setField("visitorName", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                <input type="text" value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.email || ""} onChange={(e) => setField("email", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Customer Profile</label>
                <select value={form.customerProfile || ""} onChange={(e) => setField("customerProfile", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {CUSTOMER_PROFILES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.prospect} onChange={(e) => setField("prospect", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-600">Hot Prospect</span>
                  {form.prospect && <span className="text-yellow-500 text-lg">&#9733;</span>}
                </label>
              </div>
            </div>

            {/* Source & Project */}
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Source & Project</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Source</label>
                <select value={form.source} onChange={(e) => setField("source", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Source</option>
                  {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Source Details</label>
                <input type="text" value={form.sourceDetails || ""} onChange={(e) => setField("sourceDetails", e.target.value)}
                  placeholder="e.g. referral name, ad details"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Project</label>
                <select value={form.projectName} onChange={(e) => setField("projectName", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Project</option>
                  {projectNames.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Handled By <span className="text-red-500">*</span></label>
                <input type="text" value={form.handledBy} onChange={(e) => setField("handledBy", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>

            {/* Interest Details */}
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Interest Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Plot Size Interested</label>
                <select value={form.plotSizeInterested || ""} onChange={(e) => setField("plotSizeInterested", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {PLOT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Budget Range</label>
                <select value={form.budgetRange || ""} onChange={(e) => setField("budgetRange", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Facing Preference</label>
                <select value={form.facingPreference || ""} onChange={(e) => setField("facingPreference", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {FACING_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Mode</label>
                <select value={form.paymentMode || ""} onChange={(e) => setField("paymentMode", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Follow-up Management */}
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Follow-up Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status || "WARM"} onChange={(e) => setField("status", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="mt-1">{statusBadge(form.status || "WARM")}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Next Follow-Up Date</label>
                <input type="date" value={form.nextFollowUpDate || ""} onChange={(e) => setField("nextFollowUpDate", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Remarks / Feedback</label>
                <textarea value={form.remarks || ""} onChange={(e) => setField("remarks", e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Follow-up 1</label>
                <input type="text" value={form.followUp1 || ""} onChange={(e) => setField("followUp1", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Follow-up 2</label>
                <input type="text" value={form.followUp2 || ""} onChange={(e) => setField("followUp2", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Follow-up 3</label>
                <input type="text" value={form.followUp3 || ""} onChange={(e) => setField("followUp3", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : editId ? "Update Walk-In" : "Save Walk-In"}
              </button>
              {editId && (
                <button type="button" onClick={() => { setForm({ ...emptyForm }); setEditId(null); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium transition-colors">
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ═══════════ TAB 2: LIST ═══════════ */}
      {activeTab === "list" && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Projects</option>
              {projectNames.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} placeholder="From"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} placeholder="To"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search name or phone"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Refresh */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">{filteredWalkIns.length} record(s)</span>
            <button onClick={loadList} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Refresh</button>
          </div>

          {listLoading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : filteredWalkIns.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No walk-ins found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-3 py-2">S.No</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Project</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Budget</th>
                    <th className="px-3 py-2">Handled By</th>
                    <th className="px-3 py-2">Follow-Up</th>
                    <th className="px-3 py-2 text-center">&#9733;</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWalkIns.map((w, i) => (
                    <>
                      <tr
                        key={w.id}
                        onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                        className={`border-b cursor-pointer hover:bg-gray-50 transition-colors ${w.prospect ? "bg-yellow-50" : ""}`}
                      >
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{w.visitDate?.split("T")[0] || ""}</td>
                        <td className="px-3 py-2 font-medium">{w.visitorName}</td>
                        <td className="px-3 py-2">{w.phone}</td>
                        <td className="px-3 py-2">{w.source}</td>
                        <td className="px-3 py-2">{w.projectName}</td>
                        <td className="px-3 py-2">{statusBadge(w.status)}</td>
                        <td className="px-3 py-2">{w.budgetRange || "—"}</td>
                        <td className="px-3 py-2">{w.handledBy}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{w.nextFollowUpDate?.split("T")[0] || "—"}</td>
                        <td className="px-3 py-2 text-center">{w.prospect ? <span className="text-yellow-500 text-lg">&#9733;</span> : ""}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); openFollowUp(w); }}
                              className="text-green-600 hover:text-green-800 text-xs font-medium">Follow-Up</button>
                            <button onClick={(e) => { e.stopPropagation(); startEdit(w); }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                            {canDelete && (
                              <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(w.id); }}
                                className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Detail Panel */}
                      {expandedId === w.id && (
                        <tr key={`detail-${w.id}`}>
                          <td colSpan={12} className="bg-gray-50 px-6 py-4 border-b">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div><span className="text-gray-500">Email:</span> {w.email || "—"}</div>
                              <div><span className="text-gray-500">Customer Profile:</span> {w.customerProfile || "—"}</div>
                              <div><span className="text-gray-500">Plot Size:</span> {w.plotSizeInterested || "—"}</div>
                              <div><span className="text-gray-500">Facing:</span> {w.facingPreference || "—"}</div>
                              <div><span className="text-gray-500">Payment Mode:</span> {w.paymentMode || "—"}</div>
                              <div><span className="text-gray-500">Source Details:</span> {w.sourceDetails || "—"}</div>
                              <div><span className="text-gray-500">Created By:</span> {w.createdBy || "—"}</div>
                              <div><span className="text-gray-500">Created At:</span> {w.createdAt?.split("T")[0] || "—"}</div>
                              <div className="col-span-2 md:col-span-4"><span className="text-gray-500">Remarks:</span> {w.remarks || "—"}</div>
                              <div><span className="text-gray-500">Follow-up 1:</span> {w.followUp1 || "—"}</div>
                              <div><span className="text-gray-500">Follow-up 2:</span> {w.followUp2 || "—"}</div>
                              <div><span className="text-gray-500">Follow-up 3:</span> {w.followUp3 || "—"}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete Confirm Modal */}
          {deleteConfirmId && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
                <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this walk-in record? This cannot be undone.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium">Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirmId)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium">Delete</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ═══════════ TAB 3: DASHBOARD ═══════════ */}
      {activeTab === "dashboard" && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="date" value={dashFrom} onChange={(e) => setDashFrom(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="date" value={dashTo} onChange={(e) => setDashTo(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={dashProject} onChange={(e) => setDashProject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Projects</option>
              {projectNames.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={loadDashboard} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Apply
            </button>
          </div>

          {dashLoading ? (
            <div className="text-center py-10 text-gray-500">Loading dashboard...</div>
          ) : !dashStats ? (
            <div className="text-center py-10 text-gray-400">No data available.</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <SummaryCard label="Total Walk-Ins" value={dashStats.totalWalkIns} color="bg-blue-50 text-blue-700 border-blue-200" />
                <SummaryCard label="Hot Leads" value={dashStats.hotLeads} color="bg-red-50 text-red-700 border-red-200" />
                <SummaryCard label="Pending Follow-ups" value={dashStats.pendingFollowUps} color="bg-amber-50 text-amber-700 border-amber-200" />
                <SummaryCard label="Converted" value={dashStats.byStatus["CONVERTED"] || 0} color="bg-green-50 text-green-700 border-green-200" />
              </div>

              {/* Source Breakdown */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Walk-Ins by Source</h3>
                <div className="space-y-2">
                  {Object.entries(dashStats.bySource)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => {
                      const pct = dashStats.totalWalkIns > 0 ? (count / dashStats.totalWalkIns) * 100 : 0;
                      return (
                        <div key={source} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-36 truncate">{source}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Status Pipeline */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Status Pipeline</h3>
                <div className="flex rounded-lg overflow-hidden h-8">
                  {STATUS_OPTIONS.map((s) => {
                    const count = dashStats.byStatus[s] || 0;
                    const pct = dashStats.totalWalkIns > 0 ? (count / dashStats.totalWalkIns) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={s}
                        className="flex items-center justify-center text-white text-xs font-semibold"
                        style={{ width: `${pct}%`, backgroundColor: STATUS_HEX[s], minWidth: pct > 0 ? "40px" : "0" }}
                        title={`${s}: ${count}`}
                      >
                        {pct >= 8 ? `${s} (${count})` : count}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {STATUS_OPTIONS.map((s) => (
                    <div key={s} className="flex items-center gap-1 text-xs text-gray-600">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_HEX[s] }} />
                      {s}: {dashStats.byStatus[s] || 0}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales Person Performance */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Sales Person Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-2">Handler</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2 text-right">Hot Leads</th>
                        <th className="px-4 py-2 text-right">Converted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(dashStats.byHandler)
                        .sort(([, a], [, b]) => b - a)
                        .map(([handler, total]) => (
                          <tr key={handler} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{handler}</td>
                            <td className="px-4 py-2 text-right">{total}</td>
                            <td className="px-4 py-2 text-right">—</td>
                            <td className="px-4 py-2 text-right">—</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-1">Hot leads and converted counts require detailed handler stats from the API.</p>
                </div>
              </div>

              {/* Daily Trend */}
              <div>
                <h3 className="text-md font-semibold text-gray-700 mb-3">Daily Walk-In Trend</h3>
                {dashStats.byDate.length === 0 ? (
                  <p className="text-sm text-gray-400">No daily data available.</p>
                ) : (
                  <div className="flex items-end gap-1 h-40 overflow-x-auto pb-6 relative">
                    {(() => {
                      const maxCount = Math.max(...dashStats.byDate.map((d) => d.count), 1);
                      return dashStats.byDate.map((d) => (
                        <div key={d.date} className="flex flex-col items-center" style={{ minWidth: "28px" }}>
                          <span className="text-xs text-gray-500 mb-1">{d.count}</span>
                          <div
                            className="bg-blue-500 rounded-t w-5 transition-all"
                            style={{ height: `${(d.count / maxCount) * 120}px` }}
                            title={`${d.date}: ${d.count}`}
                          />
                          <span className="text-xs text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════ FOLLOW-UP MODAL (global, works from any tab) ═══════════ */}
      {followUpWalkIn && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Quick Follow-Up Update</h3>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <div>
                <span className="text-sm font-medium text-gray-700">{followUpWalkIn.visitorName}</span>
                <span className="text-sm text-gray-400 ml-2">{followUpWalkIn.phone}</span>
              </div>
              {statusBadge(followUpWalkIn.status)}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select value={followUpForm.status} onChange={(e) => setFollowUpForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="mt-1">{statusBadge(followUpForm.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Next Follow-Up Date</label>
                <input type="date" value={followUpForm.nextFollowUpDate}
                  onChange={(e) => setFollowUpForm((f) => ({ ...f, nextFollowUpDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Remarks / Feedback</label>
                <textarea value={followUpForm.remarks} rows={2}
                  onChange={(e) => setFollowUpForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Follow-up 1</label>
                <input type="text" value={followUpForm.followUp1}
                  onChange={(e) => setFollowUpForm((f) => ({ ...f, followUp1: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Follow-up 2</label>
                <input type="text" value={followUpForm.followUp2}
                  onChange={(e) => setFollowUpForm((f) => ({ ...f, followUp2: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Follow-up 3</label>
                <input type="text" value={followUpForm.followUp3}
                  onChange={(e) => setFollowUpForm((f) => ({ ...f, followUp3: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setFollowUpWalkIn(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={handleFollowUpSave} disabled={followUpSaving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50">
                {followUpSaving ? "Saving..." : "Save Follow-Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
