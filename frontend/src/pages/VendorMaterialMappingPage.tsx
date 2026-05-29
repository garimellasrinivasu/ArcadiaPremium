import { useState, useEffect } from "react";
import {
  vendorMaterialMappingService,
  materialMasterService,
} from "../services/materialService";
import type {
  VendorMaterialMappingDto,
  MaterialMasterDto,
} from "../services/materialService";
import { vendorService } from "../services/vendorService";
import type { VendorDto } from "../services/vendorService";

export default function VendorMaterialMappingPage() {
  const [mappings, setMappings] = useState<VendorMaterialMappingDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterVendorId, setFilterVendorId] = useState<number>(0);
  const [filterMaterialId, setFilterMaterialId] = useState<number>(0);

  // Create form
  const [showModal, setShowModal] = useState(false);
  const [newVendorId, setNewVendorId] = useState<number>(0);
  const [newMaterialId, setNewMaterialId] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVendors();
    loadMaterials();
    loadMappings();
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

  const loadMappings = async () => {
    setLoading(true);
    try {
      let data: VendorMaterialMappingDto[];
      if (filterVendorId) {
        data = await vendorMaterialMappingService.getByVendor(filterVendorId);
      } else if (filterMaterialId) {
        data = await vendorMaterialMappingService.getByMaterial(filterMaterialId);
      } else {
        data = await vendorMaterialMappingService.getAll();
      }
      setMappings(data);
    } catch (err) {
      console.error("Failed to load mappings:", err);
      setMappings([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMappings();
  }, [filterVendorId, filterMaterialId]);

  const handleCreate = async () => {
    if (!newVendorId || !newMaterialId) {
      alert("Please select both a vendor and a material.");
      return;
    }
    setSaving(true);
    try {
      await vendorMaterialMappingService.create({
        vendorId: newVendorId,
        materialId: newMaterialId,
      });
      setShowModal(false);
      setNewVendorId(0);
      setNewMaterialId(0);
      loadMappings();
    } catch (err: any) {
      alert("Failed to create mapping.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;
    try {
      await vendorMaterialMappingService.delete(id);
      loadMappings();
    } catch (err: any) {
      alert("Failed to delete mapping.\n" + (err.message || err));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Vendor-Material Mapping</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Mapping
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
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
          {mappings.length} mapping{mappings.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : mappings.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No mappings found. Click "Add Mapping" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 font-medium">Material</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {m.vendorName || `Vendor #${m.vendorId}`}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {m.materialName || `Material #${m.materialId}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        m.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {m.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Mapping Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Vendor-Material Mapping</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vendor *</label>
                <select
                  value={newVendorId}
                  onChange={(e) => setNewVendorId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value={0}>-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Material *</label>
                <select
                  value={newMaterialId}
                  onChange={(e) => setNewMaterialId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value={0}>-- Select Material --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.uom})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !newVendorId || !newMaterialId}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
