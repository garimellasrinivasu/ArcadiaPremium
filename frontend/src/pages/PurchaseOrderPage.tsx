import { useState, useEffect } from "react";
import { purchaseOrderService } from "../services/purchaseOrderService";
import type { PurchaseOrderDto, CreatePurchaseOrderRequest } from "../services/purchaseOrderService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";
import { vendorService } from "../services/vendorService";
import type { VendorDto } from "../services/vendorService";
import { materialMasterService } from "../services/materialService";
import type { MaterialMasterDto } from "../services/materialService";
import { indentService } from "../services/indentService";
import type { MaterialIndentDto } from "../services/indentService";

const STATUS_LIST = ["All", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  CANCELLED: "bg-red-100 text-red-600",
};

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface LineItem {
  materialId: number;
  quantity: number;
  rate: number;
  taxPercent: number;
}

const emptyLineItem: LineItem = { materialId: 0, quantity: 0, rate: 0, taxPercent: 0 };

interface POForm {
  projectId: number;
  vendorId: number;
  poDate: string;
  deliveryDate: string;
  referenceType: string;
  indentId: number;
  advancePercent: number;
  billingTerms: string;
  paymentTerms: string;
  remarks: string;
  items: LineItem[];
}

const emptyForm: POForm = {
  projectId: 0, vendorId: 0, poDate: "", deliveryDate: "",
  referenceType: "DIRECT", indentId: 0, advancePercent: 0,
  billingTerms: "", paymentTerms: "", remarks: "",
  items: [{ ...emptyLineItem }],
};

export default function PurchaseOrderPage() {
  const [records, setRecords] = useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState(0);
  const [vendorFilter, setVendorFilter] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterDto[]>([]);
  const [indents, setIndents] = useState<MaterialIndentDto[]>([]);
  const [form, setForm] = useState<POForm>({ ...emptyForm, items: [{ ...emptyLineItem }] });

  useEffect(() => { loadData(); loadDropdowns(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setRecords(await purchaseOrderService.getAll()); } catch (err) { console.error(err); setRecords([]); }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [p, v, m, i] = await Promise.all([
        projectService.getActiveProjects(), vendorService.getActive(),
        materialMasterService.getActive(), indentService.getAll(),
      ]);
      setProjects(p); setVendors(v); setMaterials(m);
      setIndents(i.filter((ind) => ind.status === "APPROVED"));
    } catch (err) { console.error(err); }
  };

  const filtered = records.filter((r) => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (projectFilter && r.projectId !== projectFilter) return false;
    if (vendorFilter && r.vendorId !== vendorFilter) return false;
    return true;
  });

  const openCreate = () => { setForm({ ...emptyForm, items: [{ ...emptyLineItem }] }); setShowModal(true); };

  const updateField = (field: keyof Omit<POForm, "items">, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (idx: number, field: keyof LineItem, value: number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyLineItem }] }));
  const removeItem = (idx: number) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: items.length > 0 ? items : [{ ...emptyLineItem }] };
    });
  };

  const rowAmount = (item: LineItem) => item.quantity * item.rate;
  const rowTax = (item: LineItem) => rowAmount(item) * (item.taxPercent / 100);
  const formTotalAmount = form.items.reduce((s, it) => s + rowAmount(it), 0);
  const formTaxAmount = form.items.reduce((s, it) => s + rowTax(it), 0);
  const formGrandTotal = formTotalAmount + formTaxAmount;

  const handleSave = async () => {
    if (!form.projectId) { alert("Please select a Project."); return; }
    if (!form.vendorId) { alert("Please select a Vendor."); return; }
    if (!form.poDate) { alert("PO Date is required."); return; }
    const validItems = form.items.filter((it) => it.materialId > 0 && it.quantity > 0 && it.rate > 0);
    if (validItems.length === 0) { alert("At least one valid item is required."); return; }

    setSaving(true);
    try {
      const req: CreatePurchaseOrderRequest = {
        projectId: form.projectId,
        vendorId: form.vendorId,
        poDate: form.poDate,
        deliveryDate: form.deliveryDate || undefined,
        referenceType: form.referenceType,
        indentId: form.referenceType === "FROM_INDENT" ? form.indentId : undefined,
        advancePercent: form.advancePercent || undefined,
        billingTerms: form.billingTerms || undefined,
        paymentTerms: form.paymentTerms || undefined,
        remarks: form.remarks || undefined,
        items: validItems.map((it) => ({
          materialId: it.materialId,
          quantity: it.quantity,
          rate: it.rate,
          taxPercent: it.taxPercent || undefined,
        })),
      };
      await purchaseOrderService.create(req);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert("Failed to create PO.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try { await purchaseOrderService.updateStatus(id, newStatus); loadData(); }
    catch (err: any) { alert("Failed to update status.\n" + (err.message || err)); }
  };

  const handlePrint = async (id: number) => {
    try {
      const data = await purchaseOrderService.getPrintData(id);
      const po = data.poDetails || {};
      const vendor = data.vendorDetails || {};
      const items = data.items || [];
      const terms = data.terms || {};

      const w = window.open("", "_blank");
      if (!w) { alert("Please allow popups to print PO."); return; }

      const itemRows = items.map((it: any, i: number) => `
        <tr>
          <td style="border:1px solid #ddd;padding:6px;text-align:center">${i+1}</td>
          <td style="border:1px solid #ddd;padding:6px">${it.materialName || '—'}</td>
          <td style="border:1px solid #ddd;padding:6px;text-align:center">${it.uom || '—'}</td>
          <td style="border:1px solid #ddd;padding:6px;text-align:right">${Number(it.quantity || 0).toLocaleString('en-IN')}</td>
          <td style="border:1px solid #ddd;padding:6px;text-align:right">₹${Number(it.rate || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
          <td style="border:1px solid #ddd;padding:6px;text-align:right">${it.taxPercent ? it.taxPercent + '%' : '—'}</td>
          <td style="border:1px solid #ddd;padding:6px;text-align:right;font-weight:600">₹${Number(it.amount || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
        </tr>
      `).join('');

      w.document.write(`<!DOCTYPE html><html><head><title>PO - ${po.poNumber || ''}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:20px;color:#333}
          h1{text-align:center;color:#1e40af;margin-bottom:5px}
          .subtitle{text-align:center;color:#666;margin-bottom:20px}
          .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px}
          .info-box{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
          .info-box h3{margin:0 0 8px;color:#374151;font-size:14px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
          .info-row{display:flex;justify-content:space-between;font-size:13px;margin:3px 0}
          .info-row .label{color:#6b7280}
          .info-row .value{font-weight:600}
          table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px}
          th{background:#f3f4f6;border:1px solid #ddd;padding:8px;text-align:left}
          .totals{text-align:right;margin:10px 0;font-size:14px}
          .totals .row{margin:4px 0}
          .totals .grand{font-size:16px;font-weight:bold;color:#1e40af}
          .terms{margin-top:20px;font-size:13px}
          .terms h3{color:#374151;margin-bottom:8px}
          .terms p{margin:4px 0;color:#4b5563}
          @media print{body{margin:10px}}
        </style>
      </head><body>
        <h1>PURCHASE ORDER</h1>
        <p class="subtitle">${po.poNumber || ''} | Date: ${po.poDate || ''}</p>
        <div class="info-grid">
          <div class="info-box">
            <h3>Order Details</h3>
            <div class="info-row"><span class="label">PO Number:</span><span class="value">${po.poNumber || ''}</span></div>
            <div class="info-row"><span class="label">PO Date:</span><span class="value">${po.poDate || ''}</span></div>
            <div class="info-row"><span class="label">Delivery Date:</span><span class="value">${po.deliveryDate || '—'}</span></div>
            <div class="info-row"><span class="label">Project:</span><span class="value">${po.projectName || '—'}</span></div>
            <div class="info-row"><span class="label">Status:</span><span class="value">${po.status || ''}</span></div>
          </div>
          <div class="info-box">
            <h3>Vendor Details</h3>
            <div class="info-row"><span class="label">Name:</span><span class="value">${vendor.name || ''}</span></div>
            <div class="info-row"><span class="label">Address:</span><span class="value">${vendor.address || '—'}</span></div>
            <div class="info-row"><span class="label">Phone:</span><span class="value">${vendor.phone || '—'}</span></div>
            <div class="info-row"><span class="label">Email:</span><span class="value">${vendor.email || '—'}</span></div>
            <div class="info-row"><span class="label">GSTIN:</span><span class="value">${vendor.gstNumber || '—'}</span></div>
          </div>
        </div>
        <table>
          <thead><tr>
            <th style="width:40px;text-align:center">#</th>
            <th>Material</th><th style="width:60px;text-align:center">UOM</th>
            <th style="width:80px;text-align:right">Qty</th>
            <th style="width:100px;text-align:right">Rate</th>
            <th style="width:60px;text-align:right">Tax%</th>
            <th style="width:110px;text-align:right">Amount</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="totals">
          <div class="row">Total: ₹${Number(po.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
          <div class="row">Tax: ₹${Number(po.taxAmount || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
          <div class="row grand">Grand Total: ₹${Number(po.grandTotal || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
        </div>
        ${terms.billingTerms || terms.paymentTerms || terms.packingForwarding || terms.remarks ? `
        <div class="terms">
          <h3>Terms & Conditions</h3>
          ${terms.billingTerms ? `<p><strong>Billing:</strong> ${terms.billingTerms}</p>` : ''}
          ${terms.paymentTerms ? `<p><strong>Payment:</strong> ${terms.paymentTerms}</p>` : ''}
          ${terms.packingForwarding ? `<p><strong>Packing & Forwarding:</strong> ${terms.packingForwarding}</p>` : ''}
          ${terms.remarks ? `<p><strong>Remarks:</strong> ${terms.remarks}</p>` : ''}
        </div>` : ''}
        <script>window.onload=function(){window.print()}</script>
      </body></html>`);
      w.document.close();
    } catch (err: any) {
      alert("Failed to load print data.\n" + (err.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this PO?")) return;
    try { await purchaseOrderService.delete(id); loadData(); }
    catch (err: any) { alert("Failed to delete.\n" + (err.message || err)); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Purchase Orders</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">+ New PO</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1 flex-wrap">
            {STATUS_LIST.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s === "All" ? "All" : s}</button>
            ))}
          </div>
          <select value={projectFilter} onChange={(e) => setProjectFilter(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value={0}>All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value={0}>All Vendors</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} PO{filtered.length !== 1 ? "s" : ""} found</p>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No purchase orders found.</div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map((po) => (
            <div key={po.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setExpandedId(expandedId === po.id ? null : po.id)}>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{po.poNumber}</p>
                  <p className="text-xs text-gray-400">{po.projectName}</p>
                </div>
                <div className="w-36">
                  <p className="text-xs text-gray-400">Vendor</p>
                  <p className="text-sm text-gray-700">{po.vendorName}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">PO Date</p>
                  <p className="text-sm text-gray-700">{po.poDate}</p>
                </div>
                <div className="w-24">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[po.status] || "bg-gray-100 text-gray-700"}`}>{po.status}</span>
                </div>
                <div className="w-32 text-right">
                  <p className="text-sm font-bold text-green-600">{fmt(Number(po.grandTotal || 0))}</p>
                </div>
                <span className={`text-xs font-bold transition-transform ${expandedId === po.id ? "rotate-90" : ""}`}>&#9654;</span>
              </div>

              {expandedId === po.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div><span className="text-gray-400 text-xs">Delivery Date</span><p className="font-semibold">{po.deliveryDate || "—"}</p></div>
                    <div><span className="text-gray-400 text-xs">Advance %</span><p className="font-semibold">{po.advancePercent ?? "—"}</p></div>
                    <div><span className="text-gray-400 text-xs">Total Amount</span><p className="font-semibold">{fmt(Number(po.totalAmount || 0))}</p></div>
                    <div><span className="text-gray-400 text-xs">Tax Amount</span><p className="font-semibold">{fmt(Number(po.taxAmount || 0))}</p></div>
                  </div>
                  {po.billingTerms && <p className="text-xs text-gray-500 mb-1">Billing: {po.billingTerms}</p>}
                  {po.paymentTerms && <p className="text-xs text-gray-500 mb-1">Payment: {po.paymentTerms}</p>}
                  {po.remarks && <p className="text-xs text-gray-500 mb-3">Remarks: {po.remarks}</p>}

                  {po.items && po.items.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Material</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">UOM</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Rate</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {po.items.map((item, idx) => (
                            <tr key={item.id ?? idx} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                              <td className="px-3 py-2 font-medium">{item.materialName}</td>
                              <td className="px-3 py-2">{item.materialUom || "—"}</td>
                              <td className="px-3 py-2 text-right">{Number(item.quantity)}</td>
                              <td className="px-3 py-2 text-right">{fmt(Number(item.rate))}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(Number(item.amount || 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300 bg-gray-50">
                            <td colSpan={5} className="px-3 py-2 text-right font-bold text-gray-700">Grand Total</td>
                            <td className="px-3 py-2 text-right font-bold text-green-600">{fmt(Number(po.grandTotal || 0))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {po.status === "DRAFT" && (
                      <button onClick={() => handleStatusChange(po.id, "SUBMITTED")} className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Submit</button>
                    )}
                    {po.status === "SUBMITTED" && (
                      <>
                        <button onClick={() => handleStatusChange(po.id, "APPROVED")} className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-600 rounded-lg hover:bg-green-100">Approve</button>
                        <button onClick={() => handleStatusChange(po.id, "REJECTED")} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Reject</button>
                      </>
                    )}
                    {po.status === "DRAFT" && (
                      <button onClick={() => handleDelete(po.id)} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
                    )}
                    {po.status === "APPROVED" && (
                      <button onClick={() => handlePrint(po.id)} className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">Print PO</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create Purchase Order</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Project <span className="text-red-500">*</span></label>
                  <select value={form.projectId} onChange={(e) => updateField("projectId", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select Project --</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vendor <span className="text-red-500">*</span></label>
                  <select value={form.vendorId} onChange={(e) => updateField("vendorId", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select Vendor --</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reference Type</label>
                  <select value={form.referenceType} onChange={(e) => updateField("referenceType", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="DIRECT">Direct</option>
                    <option value="FROM_INDENT">From Indent</option>
                  </select>
                </div>
              </div>

              {form.referenceType === "FROM_INDENT" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Indent</label>
                  <select value={form.indentId} onChange={(e) => updateField("indentId", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select Indent --</option>
                    {indents.filter((ind) => !form.projectId || ind.projectId === form.projectId).map((ind) => (
                      <option key={ind.id} value={ind.id}>{ind.indentNo} - {ind.projectName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">PO Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.poDate} onChange={(e) => updateField("poDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Delivery Date</label>
                  <input type="date" value={form.deliveryDate} onChange={(e) => updateField("deliveryDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Advance %</label>
                  <input type="number" min={0} max={100} value={form.advancePercent || ""} onChange={(e) => updateField("advancePercent", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Billing Terms</label>
                  <input type="text" value={form.billingTerms} onChange={(e) => updateField("billingTerms", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Payment Terms</label>
                  <input type="text" value={form.paymentTerms} onChange={(e) => updateField("paymentTerms", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => updateField("remarks", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[200px]">Material</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[90px]">Qty</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[100px]">Rate</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[80px]">Tax %</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[110px]">Amount</th>
                        <th className="px-2 py-2 w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-2 py-1.5">
                            <select value={item.materialId} onChange={(e) => updateItem(idx, "materialId", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                              <option value={0}>-- Select --</option>
                              {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={0} value={item.quantity || ""} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={0} value={item.rate || ""} onChange={(e) => updateItem(idx, "rate", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={0} max={100} value={item.taxPercent || ""} onChange={(e) => updateItem(idx, "taxPercent", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                          </td>
                          <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700">{fmt(rowAmount(item))}</td>
                          <td className="px-2 py-1.5 text-center">
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold" title="Remove">&#10005;</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td colSpan={4} className="px-2 py-2 text-right text-xs font-bold text-gray-600">Total Amount:</td>
                        <td className="px-2 py-2 text-right text-xs font-bold">{fmt(formTotalAmount)}</td>
                        <td></td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-2 py-1 text-right text-xs font-bold text-gray-600">Tax Amount:</td>
                        <td className="px-2 py-1 text-right text-xs font-bold">{fmt(formTaxAmount)}</td>
                        <td></td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-2 py-2 text-right text-xs font-bold text-green-700">Grand Total:</td>
                        <td className="px-2 py-2 text-right text-xs font-bold text-green-700">{fmt(formGrandTotal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <button onClick={addItem} className="mt-2 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">+ Add Item</button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
