import { useState, useEffect } from "react";
import {
  materialRateService,
  materialMasterService,
} from "../services/materialService";
import type {
  MaterialRateDto,
  CreateMaterialRateRequest,
  MaterialMasterDto,
} from "../services/materialService";
import { vendorService } from "../services/vendorService";
import type { VendorDto } from "../services/vendorService";

const TAX_TYPES = ["CGST", "SGST", "IGST"] as const;

const STATUS_LIST = ["All", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const emptyForm: CreateMaterialRateRequest = {
  vendorId: 0,
  materialId: 0,
  rate: 0,
  rateDate: new Date().toISOString().slice(0, 10),
  taxPercent: undefined,
  taxType: undefined,
  remarks: "",
};

export default function MaterialRatePage() {
  const [rates, setRates] = useState<MaterialRateDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterVendorId, setFilterVendorId] = useState<number>(0);
  const [filterMaterialId, setFilterMaterialId] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateMaterialRateRequest>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadVendors();
    loadMaterials();
    loadRates();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await vendorService.getAll();
      setVendors(data);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await materialMasterService.getAll();
      setMaterials(data);
    } catch (err) {
      console.error("Failed to load materials:", err);
    }
  };

  const loadRates = async () => {
    setLoading(true);
    try {
      let data: MaterialRateDto[];
      if (filterVendorId) {
        data = await materialRateService.getByVendor(filterVendorId);
      } else if (filterMaterialId) {
        data = await materialRateService.getByMaterial(filterMaterialId);
      } else {
        data = await materialRateService.getAll();
      }
      setRates(data);
    } catch (err) {
      console.error("Failed to load rates:", err);
      setRates([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRates();
  }, [filterVendorId, filterMaterialId]);

  const filtered = rates.filter((r) => {
    if (statusFilter === "All") return true;
    const s = r.status || (r.approved ? "APPROVED" : "DRAFT");
    return s === statusFilter;
  });

  const openCreate = () => {
    setForm({ ...emptyForm, rateDate: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.vendorId || !form.materialId || !form.rate) {
      alert("Vendor, Material, and Rate are required.");
      return;
    }
    setSaving(true);
    try {
      await materialRateService.create(form);
      setShowModal(false);
      loadRates();
    } catch (err: any) {
      alert("Failed to save rate.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleSubmit = async (id: number) => {
    try {
      await materialRateService.submit(id);
      loadRates();
    } catch (err: any) {
      alert("Failed to submit rate.\n" + (err.message || err));
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await materialRateService.approve(id);
      loadRates();
    } catch (err: any) {
      alert("Failed to approve rate.\n" + (err.message || err));
    }
  };

  const openRejectModal = (id: number) => {
    setRejectReason("");
    setRejectModal({ open: true, id });
  };

  const handleReject = async () => {
    if (!rejectModal.id) return;
    if (!rejectReason.trim()) { alert("Please provide a rejection reason."); return; }
    setRejecting(true);
    try {
      await materialRateService.reject(rejectModal.id, rejectReason.trim());
      setRejectModal({ open: false, id: null });
      loadRates();
    } catch (err: any) {
      alert("Failed to reject rate.\n" + (err.message || err));
    }
    setRejecting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this rate?")) return;
    try {
      await materialRateService.delete(id);
      loadRates();
    } catch (err: any) {
      alert("Failed to delete rate.\n" + (err.message || err));
    }
  };

  const getStatus = (r: MaterialRateDto) => r.status || (r.approved ? "APPROVED" : "DRAFT");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Material Rates</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Rate
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1 flex-wrap">
            {STATUS_LIST.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >{s === "All" ? "All" : s}</button>
            ))}
          </div>
          <div className="min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Filter by Vendor</label>
            <select
              value={filterVendorId}
              onChange={(e) => {
                setFilterVendorId(Number(e.target.value));
                if (Number(e.target.value)) setFilterMaterialId(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value={0}>All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Filter by Material</label>
            <select
              value={filterMaterialId}
              onChange={(e) => {
                setFilterMaterialId(Number(e.target.value));
                if (Number(e.target.value)) setFilterVendorId(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value={0}>All Materials</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">
          {filtered.length} rate{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No rates found. Click "Add Rate" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium">Material</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-center px-4 py-3 font-medium">Rate Date</th>
                  <th className="text-right px-4 py-3 font-medium">Tax %</th>
                  <th className="text-center px-4 py-3 font-medium">Tax Type</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const status = getStatus(r);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {r.vendorName || `Vendor #${r.vendorId}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.materialName || `Material #${r.materialId}`}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {r.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {r.rateDate}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {r.taxPercent != null ? `${r.taxPercent}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.taxType ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700">
                            {r.taxType}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}
                          title={
                            status === "SUBMITTED" && r.submittedBy ? `Submitted by: ${r.submittedBy}` :
                            status === "REJECTED" && r.rejectionReason ? `Reason: ${r.rejectionReason}` :
                            undefined
                          }
                        >
                          {status}
                        </span>
                        {status === "SUBMITTED" && r.submittedBy && (
                          <p className="text-[10px] text-gray-400 mt-0.5">by {r.submittedBy}</p>
                        )}
                        {status === "REJECTED" && r.rejectionReason && (
                          <p className="text-[10px] text-red-400 mt-0.5 max-w-[140px] truncate mx-auto" title={r.rejectionReason}>
                            {r.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => handleSubmit(r.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                            >
                              Submit
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {status === "SUBMITTED" && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="text-green-600 hover:text-green-800 text-xs font-medium mr-3"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(r.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {status === "REJECTED" && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Reject Material Rate</h2>
            </div>
            <div className="px-6 py-4">
              <label className="block text-xs text-gray-500 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setRejectModal({ open: false, id: null })}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {rejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Add Material Rate</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.vendorId}
                    onChange={(e) => setForm((prev) => ({ ...prev, vendorId: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value={0}>-- Select Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Material <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.materialId}
                    onChange={(e) => setForm((prev) => ({ ...prev, materialId: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value={0}>-- Select Material --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.uom})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Rate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.rate || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, rate: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rate Date</label>
                  <input
                    type="date"
                    value={form.rateDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, rateDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tax %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxPercent ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        taxPercent: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g. 18"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tax Type</label>
                  <select
                    value={form.taxType || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        taxType: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- None --</option>
                    {TAX_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea
                  value={form.remarks || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
