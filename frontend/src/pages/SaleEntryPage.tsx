import { useEffect, useState } from "react";
import { saleService } from "../services/saleService";
import type { SaleEntry, CreateSaleEntryRequest } from "../types/user";

const PROJECTS = ["Praneeth Arcadia Premium", "Redfern Square"];
const SPG_OPTIONS = ["SPG", "Praneeth"];
const TYPE_OPTIONS = ["OTP", "R"];
const PERSONAL_COMPANY = ["Personal", "Company"];
const FACING_OPTIONS = ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"];

const emptyForm: CreateSaleEntryRequest = {
  bookingDate: new Date().toISOString().split("T")[0],
  project: "",
  spgPraneeth: "",
  tokenNumber: "",
  customerName: "",
  personalCompany: "",
  sol: "",
  typeOfSale: "OTP",
  landExtentSqYards: undefined,
  sbuaSft: undefined,
  facing: "",
  basePricePerSft: undefined,
  amenitiesPremiums: "",
  receivedAmount: undefined,
  remarks: "",
};

function formatCurrency(val?: number) {
  if (val == null) return "—";
  return "₹ " + val.toLocaleString("en-IN");
}

export default function SaleEntryPage() {
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateSaleEntryRequest>({ ...emptyForm });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<SaleEntry | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // View detail modal
  const [viewEntry, setViewEntry] = useState<SaleEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await saleService.getAll();
      setEntries(data);
    } catch {
      setError("Failed to load sale entries");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadEntries();
      return;
    }
    setLoading(true);
    try {
      const data = await saleService.search(searchTerm);
      setEntries(data);
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Auto-compute total when sbua or base price changes
  const computedTotal =
    (form.sbuaSft || 0) * (form.basePricePerSft || 0);
  const computedBalance = computedTotal - (form.receivedAmount || 0);

  const handleFieldChange = (field: keyof CreateSaleEntryRequest, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.customerName.trim()) { setError("Customer Name is required"); return; }
    if (!form.project) { setError("Project is required"); return; }

    setSaving(true);
    try {
      if (editId) {
        await saleService.update(editId, form);
        setSuccess("Sale entry updated successfully");
      } else {
        await saleService.create(form);
        setSuccess("Sale entry created successfully");
      }
      setForm({ ...emptyForm });
      setShowForm(false);
      setEditId(null);
      loadEntries();
    } catch {
      setError("Failed to save sale entry");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: SaleEntry) => {
    setForm({
      bookingDate: entry.bookingDate,
      project: entry.project,
      spgPraneeth: entry.spgPraneeth || "",
      tokenNumber: entry.tokenNumber || "",
      customerName: entry.customerName,
      personalCompany: entry.personalCompany || "",
      sol: entry.sol || "",
      typeOfSale: entry.typeOfSale || "OTP",
      landExtentSqYards: entry.landExtentSqYards,
      sbuaSft: entry.sbuaSft,
      facing: entry.facing || "",
      basePricePerSft: entry.basePricePerSft,
      amenitiesPremiums: entry.amenitiesPremiums || "",
      receivedAmount: entry.receivedAmount,
      remarks: entry.remarks || "",
    });
    setEditId(entry.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handlePaymentSubmit = async () => {
    if (!paymentModal) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt < 0) { setError("Enter a valid amount"); return; }

    setPaymentSaving(true);
    try {
      await saleService.updatePayment(paymentModal.id, {
        receivedAmount: amt,
        remarks: paymentRemarks || undefined,
      });
      setSuccess("Payment updated successfully for " + paymentModal.customerName);
      setPaymentModal(null);
      setPaymentAmount("");
      setPaymentRemarks("");
      loadEntries();
    } catch {
      setError("Failed to update payment");
    } finally {
      setPaymentSaving(false);
    }
  };

  const openPaymentModal = (entry: SaleEntry) => {
    setPaymentModal(entry);
    setPaymentAmount(entry.receivedAmount?.toString() || "0");
    setPaymentRemarks(entry.remarks || "");
    setError("");
  };

  const handleNewEntry = () => {
    setForm({ ...emptyForm });
    setEditId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Stats
  const totalSales = entries.length;
  const totalConsideration = entries.reduce((s, e) => s + (e.totalSalesConsideration || 0), 0);
  const totalReceived = entries.reduce((s, e) => s + (e.receivedAmount || 0), 0);
  const totalBalance = entries.reduce((s, e) => s + (e.balanceToReceive || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-800">Sale Entry</h2>
        <button
          onClick={handleNewEntry}
          className="px-4 py-2 text-sm font-medium text-white bg-arcadia-600 rounded-lg hover:bg-arcadia-700 transition"
        >
          + New Sale Entry
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
          <button onClick={() => setSuccess("")} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Sales</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalSales}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Consideration</p>
          <p className="text-2xl font-bold text-arcadia-700 mt-1">{formatCurrency(totalConsideration)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Received</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Balance</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none"
        />
        <button onClick={handleSearch} className="px-4 py-2 text-sm bg-gray-100 border rounded-lg hover:bg-gray-200">Search</button>
        {searchTerm && (
          <button onClick={() => { setSearchTerm(""); loadEntries(); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Clear</button>
        )}
      </div>

      {/* Sale Entry Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {editId ? "Edit Sale Entry" : "New Sale Entry"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Date, Project, SPG */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Booking Date *</label>
                <input type="date" value={form.bookingDate} onChange={(e) => handleFieldChange("bookingDate", e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project *</label>
                <select value={form.project} onChange={(e) => handleFieldChange("project", e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white">
                  <option value="">-- Select Project --</option>
                  {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SPG / Praneeth</label>
                <select value={form.spgPraneeth || ""} onChange={(e) => handleFieldChange("spgPraneeth", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white">
                  <option value="">-- Select --</option>
                  {SPG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Token, Customer, Personal/Company */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Token #</label>
                <input type="text" value={form.tokenNumber || ""} onChange={(e) => handleFieldChange("tokenNumber", e.target.value)}
                  placeholder="e.g. RS001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                <input type="text" value={form.customerName} onChange={(e) => handleFieldChange("customerName", e.target.value)} required
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Personal / Company</label>
                <select value={form.personalCompany || ""} onChange={(e) => handleFieldChange("personalCompany", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white">
                  <option value="">-- Select --</option>
                  {PERSONAL_COMPANY.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: SOL, Type of Sale, Facing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SOL (Source of Lead)</label>
                <input type="text" value={form.sol || ""} onChange={(e) => handleFieldChange("sol", e.target.value)}
                  placeholder="e.g. Referral name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type of Sale</label>
                <div className="flex gap-2 mt-1">
                  {TYPE_OPTIONS.map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => handleFieldChange("typeOfSale", opt)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                        form.typeOfSale === opt
                          ? "bg-arcadia-600 text-white border-arcadia-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-arcadia-400"
                      }`}>
                      {opt === "OTP" ? "OTP" : "Resale"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Facing</label>
                <select value={form.facing || ""} onChange={(e) => handleFieldChange("facing", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white">
                  <option value="">-- Select --</option>
                  {FACING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4: Land Extent, SBUA, Base Price */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Land Extent (Sq.yards)</label>
                <input type="number" step="0.01" value={form.landExtentSqYards ?? ""} onChange={(e) => handleFieldChange("landExtentSqYards", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SBUA (sft)</label>
                <input type="number" step="0.01" value={form.sbuaSft ?? ""} onChange={(e) => handleFieldChange("sbuaSft", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Base Price per Sft (₹)</label>
                <input type="number" step="0.01" value={form.basePricePerSft ?? ""} onChange={(e) => handleFieldChange("basePricePerSft", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
            </div>

            {/* Computed total display */}
            {(form.sbuaSft && form.basePricePerSft) ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-6">
                <div>
                  <span className="text-xs text-blue-600 font-medium">Total Sales Consideration (auto-calculated):</span>
                  <span className="ml-2 text-lg font-bold text-blue-800">{formatCurrency(computedTotal)}</span>
                </div>
                <div>
                  <span className="text-xs text-blue-600 font-medium">Balance:</span>
                  <span className={`ml-2 text-lg font-bold ${computedBalance > 0 ? "text-red-600" : "text-green-700"}`}>
                    {formatCurrency(computedBalance)}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Row 5: Amenities, Received Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amenities & Other Premiums</label>
                <input type="text" value={form.amenitiesPremiums || ""} onChange={(e) => handleFieldChange("amenitiesPremiums", e.target.value)}
                  placeholder="e.g. Including Amenities and Facing/Corner Charges are extra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Received (₹)</label>
                <input type="number" step="0.01" value={form.receivedAmount ?? ""} onChange={(e) => handleFieldChange("receivedAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
              <textarea value={form.remarks || ""} onChange={(e) => handleFieldChange("remarks", e.target.value)} rows={2}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none resize-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-arcadia-600 rounded-lg hover:bg-arcadia-700 transition disabled:opacity-50">
                {saving ? "Saving..." : editId ? "Update Entry" : "Create Entry"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Token#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SBUA (sft)</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Base Price/Sft</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Consideration</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Received</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Balance</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-10 text-gray-400">No sale entries found. Click "+ New Sale Entry" to add one.</td></tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-3 py-3 text-gray-700">{entry.serialNo}</td>
                    <td className="px-3 py-3 text-gray-700">{entry.bookingDate}</td>
                    <td className="px-3 py-3 text-gray-700 font-medium">{entry.project}</td>
                    <td className="px-3 py-3 text-gray-500">{entry.tokenNumber || "—"}</td>
                    <td className="px-3 py-3 text-gray-800 font-medium">{entry.customerName}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        entry.typeOfSale === "OTP" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {entry.typeOfSale || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-right">{entry.sbuaSft?.toLocaleString("en-IN") || "—"}</td>
                    <td className="px-3 py-3 text-gray-700 text-right">{formatCurrency(entry.basePricePerSft)}</td>
                    <td className="px-3 py-3 text-arcadia-700 font-semibold text-right">{formatCurrency(entry.totalSalesConsideration)}</td>
                    <td className="px-3 py-3 text-green-700 font-semibold text-right">{formatCurrency(entry.receivedAmount)}</td>
                    <td className="px-3 py-3 text-red-600 font-semibold text-right">{formatCurrency(entry.balanceToReceive)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setViewEntry(entry)} title="View Details"
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition">
                          View
                        </button>
                        <button onClick={() => openPaymentModal(entry)} title="Update Payment"
                          className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition">
                          Payment
                        </button>
                        <button onClick={() => handleEdit(entry)} title="Edit"
                          className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setViewEntry(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Sale Entry Details — #{viewEntry.serialNo}</h3>
              <button onClick={() => setViewEntry(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail label="Booking Date" value={viewEntry.bookingDate} />
              <Detail label="Project" value={viewEntry.project} />
              <Detail label="SPG / Praneeth" value={viewEntry.spgPraneeth} />
              <Detail label="Token #" value={viewEntry.tokenNumber} />
              <Detail label="Customer Name" value={viewEntry.customerName} />
              <Detail label="Personal / Company" value={viewEntry.personalCompany} />
              <Detail label="SOL" value={viewEntry.sol} />
              <Detail label="Type of Sale" value={viewEntry.typeOfSale} />
              <Detail label="Land Extent (Sq.yards)" value={viewEntry.landExtentSqYards?.toString()} />
              <Detail label="SBUA (sft)" value={viewEntry.sbuaSft?.toLocaleString("en-IN")} />
              <Detail label="Facing" value={viewEntry.facing} />
              <Detail label="Base Price per Sft" value={formatCurrency(viewEntry.basePricePerSft)} />
              <Detail label="Amenities & Premiums" value={viewEntry.amenitiesPremiums} />
              <Detail label="Total Sales Consideration" value={formatCurrency(viewEntry.totalSalesConsideration)} highlight="blue" />
              <Detail label="Amount Received" value={formatCurrency(viewEntry.receivedAmount)} highlight="green" />
              <Detail label="Balance To Receive" value={formatCurrency(viewEntry.balanceToReceive)} highlight="red" />
              <Detail label="Balance (Plan Approved)" value={formatCurrency(viewEntry.balancePlanApproved)} />
              <Detail label="Balance (During Execution)" value={formatCurrency(viewEntry.balanceDuringExecution)} />
              {viewEntry.remarks && <div className="col-span-2"><Detail label="Remarks" value={viewEntry.remarks} /></div>}
            </div>
          </div>
        </div>
      )}

      {/* Payment Update Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPaymentModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Update Payment</h3>
            <p className="text-sm text-gray-500 mb-4">
              {paymentModal.customerName} — {paymentModal.project}
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Total Consideration:</span><span className="font-semibold">{formatCurrency(paymentModal.totalSalesConsideration)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Current Received:</span><span className="font-semibold text-green-700">{formatCurrency(paymentModal.receivedAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Current Balance:</span><span className="font-semibold text-red-600">{formatCurrency(paymentModal.balanceToReceive)}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Total Received Amount (₹) *</label>
                <input type="number" step="0.01" value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
                {paymentAmount && paymentModal.totalSalesConsideration && (
                  <p className="mt-1 text-xs text-gray-500">
                    New Balance: <span className="font-semibold text-red-600">
                      {formatCurrency(paymentModal.totalSalesConsideration - parseFloat(paymentAmount || "0"))}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <textarea value={paymentRemarks} onChange={(e) => setPaymentRemarks(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handlePaymentSubmit} disabled={paymentSaving}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                {paymentSaving ? "Updating..." : "Update Payment"}
              </button>
              <button onClick={() => setPaymentModal(null)}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, highlight }: { label: string; value?: string; highlight?: "blue" | "green" | "red" }) {
  const colorClass = highlight === "blue" ? "text-arcadia-700 font-semibold"
    : highlight === "green" ? "text-green-700 font-semibold"
    : highlight === "red" ? "text-red-600 font-semibold"
    : "text-gray-800";

  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-0.5 ${colorClass}`}>{value || "—"}</p>
    </div>
  );
}
