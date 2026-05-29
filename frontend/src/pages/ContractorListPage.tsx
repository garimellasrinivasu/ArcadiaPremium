import { useState, useEffect } from "react";
import { contractorService } from "../services/contractorService";
import type { ContractorDto, CreateContractorRequest } from "../services/contractorService";

const CONTRACTOR_TYPES = [
  "CONTRACTOR",
  "LABOUR_CONTRACTOR",
  "MATERIAL_SUPPLIER",
  "PLANT_SUPPLIER",
] as const;

const TYPE_LABELS: Record<string, string> = {
  CONTRACTOR: "Contractor",
  LABOUR_CONTRACTOR: "Labour Contractor",
  MATERIAL_SUPPLIER: "Material Supplier",
  PLANT_SUPPLIER: "Plant Supplier",
};

const emptyForm: CreateContractorRequest = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  contractorType: "CONTRACTOR",
  trade: "",
  pan: "",
  gstNo: "",
  bankAccountName: "",
  bankAccountNo: "",
  bankName: "",
  bankBranch: "",
  ifscCode: "",
  remarks: "",
};

export default function ContractorListPage() {
  const [contractors, setContractors] = useState<ContractorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingContractor, setEditingContractor] = useState<ContractorDto | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateContractorRequest>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    setLoading(true);
    try {
      const data = await contractorService.getAll();
      setContractors(data);
    } catch (err) {
      console.error("Failed to load contractors:", err);
      setContractors([]);
    }
    setLoading(false);
  };

  const filtered = contractors.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        (c.contactPerson?.toLowerCase().includes(q)) ||
        (c.phone?.toLowerCase().includes(q)) ||
        (c.city?.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (typeFilter && c.contractorType !== typeFilter) return false;
    if (activeFilter === "active" && !c.active) return false;
    if (activeFilter === "inactive" && c.active) return false;
    return true;
  });

  const openCreate = () => {
    setEditingContractor(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (c: ContractorDto) => {
    setEditingContractor(c);
    setForm({
      name: c.name,
      contactPerson: c.contactPerson || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      pincode: c.pincode || "",
      contractorType: c.contractorType,
      trade: c.trade || "",
      pan: c.pan || "",
      gstNo: c.gstNo || "",
      bankAccountName: c.bankAccountName || "",
      bankAccountNo: c.bankAccountNo || "",
      bankName: c.bankName || "",
      bankBranch: c.bankBranch || "",
      ifscCode: c.ifscCode || "",
      remarks: c.remarks || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Contractor name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingContractor) {
        await contractorService.update(editingContractor.id, form);
      } else {
        await contractorService.create(form);
      }
      setShowModal(false);
      loadContractors();
    } catch (err: any) {
      alert("Failed to save contractor.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleToggleActive = async (c: ContractorDto) => {
    try {
      await contractorService.toggleActive(c.id);
      loadContractors();
    } catch (err: any) {
      alert("Failed to toggle status.\n" + (err.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contractor?")) return;
    try {
      await contractorService.delete(id);
      loadContractors();
    } catch (err: any) {
      alert("Failed to delete contractor.\n" + (err.message || err));
    }
  };

  const updateField = (field: keyof CreateContractorRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Contractor List</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Contractor
        </button>
      </div>

      {/* Search / Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, contact, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Types</option>
              {CONTRACTOR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Active filter */}
          <div className="flex gap-1">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeFilter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f === "active" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">
          {filtered.length} contractor{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Contractor list */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No contractors found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Summary row */}
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.contactPerson || "—"}</p>
                </div>
                <div className="w-32">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      c.contractorType === "CONTRACTOR"
                        ? "bg-blue-100 text-blue-700"
                        : c.contractorType === "LABOUR_CONTRACTOR"
                        ? "bg-purple-100 text-purple-700"
                        : c.contractorType === "MATERIAL_SUPPLIER"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {TYPE_LABELS[c.contractorType] || c.contractorType}
                  </span>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-700">{c.phone || "—"}</p>
                </div>
                <div className="w-24">
                  <p className="text-xs text-gray-400">City</p>
                  <p className="text-sm text-gray-700">{c.city || "—"}</p>
                </div>
                <div className="w-16">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      c.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold transition-transform ${
                    expandedId === c.id ? "rotate-90" : ""
                  }`}
                >
                  &#9654;
                </span>
              </div>

              {/* Expanded details */}
              {expandedId === c.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-400 text-xs">Contact Person</span>
                      <p className="font-semibold">{c.contactPerson || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Email</span>
                      <p className="font-semibold">{c.email || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Phone</span>
                      <p className="font-semibold">{c.phone || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Trade / Specialisation</span>
                      <p className="font-semibold">{c.trade || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Address</span>
                      <p className="font-semibold">{c.address || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">City</span>
                      <p className="font-semibold">{c.city || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">State</span>
                      <p className="font-semibold">{c.state || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Pincode</span>
                      <p className="font-semibold">{c.pincode || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">PAN</span>
                      <p className="font-semibold">{c.pan || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">GST No</span>
                      <p className="font-semibold">{c.gstNo || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Bank Account Name</span>
                      <p className="font-semibold">{c.bankAccountName || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Account No</span>
                      <p className="font-semibold">{c.bankAccountNo || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Bank Name</span>
                      <p className="font-semibold">{c.bankName || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Branch</span>
                      <p className="font-semibold">{c.bankBranch || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">IFSC Code</span>
                      <p className="font-semibold">{c.ifscCode || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Created By</span>
                      <p className="font-semibold">{c.createdBy || "—"}</p>
                    </div>
                  </div>
                  {c.remarks && (
                    <p className="text-xs text-gray-500 mb-3">Remarks: {c.remarks}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(c);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(c);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                        c.active
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingContractor ? "Edit Contractor" : "Add Contractor"}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Row 1: Name, Contact Person */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Contractor name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson || ""}
                    onChange={(e) => updateField("contactPerson", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Phone, Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Row 3: Address */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Row 4: City, State, Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city || ""}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State</label>
                  <input
                    type="text"
                    value={form.state || ""}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={form.pincode || ""}
                    onChange={(e) => updateField("pincode", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Row 5: Type, Trade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select
                    value={form.contractorType}
                    onChange={(e) => updateField("contractorType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {CONTRACTOR_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trade / Specialisation</label>
                  <input
                    type="text"
                    value={form.trade || ""}
                    onChange={(e) => updateField("trade", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Row 6: PAN, GST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">PAN</label>
                  <input
                    type="text"
                    value={form.pan || ""}
                    onChange={(e) => updateField("pan", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">GST No</label>
                  <input
                    type="text"
                    value={form.gstNo || ""}
                    onChange={(e) => updateField("gstNo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Bank Details header */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                Bank Details
              </p>

              {/* Row 7: Bank Account Name, Account No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bank Account Name</label>
                  <input
                    type="text"
                    value={form.bankAccountName || ""}
                    onChange={(e) => updateField("bankAccountName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Account No</label>
                  <input
                    type="text"
                    value={form.bankAccountNo || ""}
                    onChange={(e) => updateField("bankAccountNo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Row 8: Bank Name, Branch, IFSC */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={form.bankName || ""}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Branch</label>
                  <input
                    type="text"
                    value={form.bankBranch || ""}
                    onChange={(e) => updateField("bankBranch", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={form.ifscCode || ""}
                    onChange={(e) => updateField("ifscCode", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea
                  value={form.remarks || ""}
                  onChange={(e) => updateField("remarks", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
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
