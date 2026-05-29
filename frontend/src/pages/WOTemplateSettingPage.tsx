import { useState, useEffect } from "react";
import { woTemplateService } from "../services/woTemplateService";
import type { WOTemplateDto } from "../services/woTemplateService";

const CONTRACT_TYPES = [
  "Built-Up Area Including All Resources",
  "Labour Only",
  "Labour + Material",
  "Lump Sum",
  "Item Rate",
  "Other",
] as const;

const VALUE_TYPES = ["PERCENTAGE", "AMOUNT"] as const;

interface TemplateForm {
  name: string;
  description: string;
  defaultContractType: string;
  defaultTermsAndConditions: string;
  defaultAdvanceType: string;
  defaultAdvanceValue: number;
  defaultRetentionType: string;
  defaultRetentionValue: number;
  active: boolean;
}

const emptyForm: TemplateForm = {
  name: "",
  description: "",
  defaultContractType: CONTRACT_TYPES[0],
  defaultTermsAndConditions: "",
  defaultAdvanceType: "PERCENTAGE",
  defaultAdvanceValue: 0,
  defaultRetentionType: "PERCENTAGE",
  defaultRetentionValue: 0,
  active: true,
};

const formatCurrency = (val: number) =>
  "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WOTemplateSettingPage() {
  const [templates, setTemplates] = useState<WOTemplateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WOTemplateDto | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState<TemplateForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await woTemplateService.getAll();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setTemplates([]);
    }
    setLoading(false);
  };

  const filtered = templates.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q))
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (t: WOTemplateDto) => {
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description || "",
      defaultContractType: t.defaultContractType || CONTRACT_TYPES[0],
      defaultTermsAndConditions: t.defaultTermsAndConditions || "",
      defaultAdvanceType: t.defaultAdvanceType || "PERCENTAGE",
      defaultAdvanceValue: t.defaultAdvanceValue || 0,
      defaultRetentionType: t.defaultRetentionType || "PERCENTAGE",
      defaultRetentionValue: t.defaultRetentionValue || 0,
      active: t.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Template name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await woTemplateService.update(editing.id, form);
      } else {
        await woTemplateService.create(form);
      }
      setShowModal(false);
      loadTemplates();
    } catch (err: any) {
      alert("Failed to save template.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleToggleActive = async (t: WOTemplateDto) => {
    try {
      await woTemplateService.toggleActive(t.id);
      loadTemplates();
    } catch (err: any) {
      alert("Failed to toggle status.\n" + (err.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await woTemplateService.delete(id);
      loadTemplates();
    } catch (err: any) {
      alert("Failed to delete template.\n" + (err.message || err));
    }
  };

  const updateField = (field: keyof TemplateForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">WO Template Settings</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Template
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Template list */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No templates found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Summary row */}
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.code}</p>
                </div>
                <div className="w-48">
                  <p className="text-xs text-gray-400">Contract Type</p>
                  <p className="text-sm text-gray-700 truncate">{t.defaultContractType || "—"}</p>
                </div>
                <div className="w-32">
                  <p className="text-xs text-gray-400">Advance</p>
                  <p className="text-sm text-gray-700">
                    {t.defaultAdvanceType === "PERCENTAGE"
                      ? `${t.defaultAdvanceValue}%`
                      : formatCurrency(t.defaultAdvanceValue)}
                  </p>
                </div>
                <div className="w-32">
                  <p className="text-xs text-gray-400">Retention</p>
                  <p className="text-sm text-gray-700">
                    {t.defaultRetentionType === "PERCENTAGE"
                      ? `${t.defaultRetentionValue}%`
                      : formatCurrency(t.defaultRetentionValue)}
                  </p>
                </div>
                <div className="w-16">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      t.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {t.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold transition-transform ${
                    expandedId === t.id ? "rotate-90" : ""
                  }`}
                >
                  &#9654;
                </span>
              </div>

              {/* Expanded details */}
              {expandedId === t.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-400 text-xs">Code</span>
                      <p className="font-semibold">{t.code}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Contract Type</span>
                      <p className="font-semibold">{t.defaultContractType || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Advance</span>
                      <p className="font-semibold">
                        {t.defaultAdvanceType === "PERCENTAGE"
                          ? `${t.defaultAdvanceValue}%`
                          : formatCurrency(t.defaultAdvanceValue)}
                        {" "}({t.defaultAdvanceType})
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Retention</span>
                      <p className="font-semibold">
                        {t.defaultRetentionType === "PERCENTAGE"
                          ? `${t.defaultRetentionValue}%`
                          : formatCurrency(t.defaultRetentionValue)}
                        {" "}({t.defaultRetentionType})
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Created By</span>
                      <p className="font-semibold">{t.createdBy || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Created At</span>
                      <p className="font-semibold">{t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "—"}</p>
                    </div>
                  </div>
                  {t.description && (
                    <p className="text-xs text-gray-500 mb-3">Description: {t.description}</p>
                  )}
                  {t.defaultTermsAndConditions && (
                    <p className="text-xs text-gray-500 mb-3 whitespace-pre-wrap">
                      Terms & Conditions: {t.defaultTermsAndConditions}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(t); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                        t.active
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {t.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
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
                {editing ? "Edit Template" : "Add Template"}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Template name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Contract Type */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Default Contract Type</label>
                <select
                  value={form.defaultContractType}
                  onChange={(e) => updateField("defaultContractType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {CONTRACT_TYPES.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Default Terms & Conditions</label>
                <textarea
                  value={form.defaultTermsAndConditions}
                  onChange={(e) => updateField("defaultTermsAndConditions", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>

              {/* Advance Type + Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Default Advance Type</label>
                  <select
                    value={form.defaultAdvanceType}
                    onChange={(e) => updateField("defaultAdvanceType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {VALUE_TYPES.map((vt) => (
                      <option key={vt} value={vt}>{vt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Default Advance Value</label>
                  <input
                    type="number"
                    value={form.defaultAdvanceValue}
                    onChange={(e) => updateField("defaultAdvanceValue", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min={0}
                  />
                </div>
              </div>

              {/* Retention Type + Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Default Retention Type</label>
                  <select
                    value={form.defaultRetentionType}
                    onChange={(e) => updateField("defaultRetentionType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {VALUE_TYPES.map((vt) => (
                      <option key={vt} value={vt}>{vt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Default Retention Value</label>
                  <input
                    type="number"
                    value={form.defaultRetentionValue}
                    onChange={(e) => updateField("defaultRetentionValue", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min={0}
                  />
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active-check"
                  checked={form.active}
                  onChange={(e) => updateField("active", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="active-check" className="text-sm text-gray-700">Active</label>
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
