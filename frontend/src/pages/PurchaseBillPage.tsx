import { useState, useEffect } from "react";
import { purchaseBillService } from "../services/purchaseBillService";
import type { PurchaseBillDto, CreatePurchaseBillRequest } from "../services/purchaseBillService";
import { purchaseOrderService } from "../services/purchaseOrderService";
import type { PurchaseOrderDto } from "../services/purchaseOrderService";
import { vendorService } from "../services/vendorService";
import type { VendorDto } from "../services/vendorService";
import { materialMasterService } from "../services/materialService";
import type { MaterialMasterDto } from "../services/materialService";

const STATUS_LIST = ["All", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface LineItem {
  materialId: number;
  quantity: number;
  rate: number;
}

const emptyLineItem: LineItem = { materialId: 0, quantity: 0, rate: 0 };

interface BillForm {
  vendorId: number;
  purchaseOrderId: number;
  vendorInvoiceNo: string;
  vendorInvoiceDate: string;
  billDate: string;
  taxAmount: number;
  discount: number;
  freightCharges: number;
  recoveryAmount: number;
  remarks: string;
  items: LineItem[];
}

const emptyForm: BillForm = {
  vendorId: 0, purchaseOrderId: 0, vendorInvoiceNo: "", vendorInvoiceDate: "",
  billDate: "", taxAmount: 0, discount: 0, freightCharges: 0, recoveryAmount: 0,
  remarks: "", items: [{ ...emptyLineItem }],
};

export default function PurchaseBillPage() {
  const [records, setRecords] = useState<PurchaseBillDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState(0);
  const [poFilter, setPoFilter] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterDto[]>([]);
  const [form, setForm] = useState<BillForm>({ ...emptyForm, items: [{ ...emptyLineItem }] });

  useEffect(() => { loadData(); loadDropdowns(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setRecords(await purchaseBillService.getAll()); } catch (err) { console.error(err); setRecords([]); }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [v, po, m] = await Promise.all([
        vendorService.getActive(), purchaseOrderService.getAll(), materialMasterService.getActive(),
      ]);
      setVendors(v); setPurchaseOrders(po.filter((p) => p.status === "APPROVED")); setMaterials(m);
    } catch (err) { console.error(err); }
  };

  const filtered = records.filter((r) => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (vendorFilter && r.vendorId !== vendorFilter) return false;
    if (poFilter && r.purchaseOrderId !== poFilter) return false;
    return true;
  });

  const openCreate = () => { setForm({ ...emptyForm, items: [{ ...emptyLineItem }] }); setShowModal(true); };

  const updateField = (field: keyof Omit<BillForm, "items">, value: string | number) => {
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
  const formTotalAmount = form.items.reduce((s, it) => s + rowAmount(it), 0);
  const formNetAmount = formTotalAmount + form.taxAmount + form.freightCharges - form.discount - form.recoveryAmount;

  const handleSave = async () => {
    if (!form.vendorId) { alert("Please select a Vendor."); return; }
    if (!form.billDate) { alert("Bill Date is required."); return; }
    const validItems = form.items.filter((it) => it.materialId > 0 && it.quantity > 0 && it.rate > 0);
    if (validItems.length === 0) { alert("At least one valid item is required."); return; }

    setSaving(true);
    try {
      const req: CreatePurchaseBillRequest = {
        vendorId: form.vendorId,
        purchaseOrderId: form.purchaseOrderId || undefined,
        billNo: "",
        billDate: form.billDate,
        totalAmount: formTotalAmount,
        taxAmount: form.taxAmount || undefined,
        discountAmount: form.discount || undefined,
        recoveryAmount: form.recoveryAmount || undefined,
        remarks: form.remarks || undefined,
        items: validItems.map((it) => ({
          materialId: it.materialId,
          quantity: it.quantity,
          rate: it.rate,
          amount: it.quantity * it.rate,
        })),
      };
      await purchaseBillService.create(req);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert("Failed to create bill.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try { await purchaseBillService.updateStatus(id, newStatus); loadData(); }
    catch (err: any) { alert("Failed to update status.\n" + (err.message || err)); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    try { await purchaseBillService.delete(id); loadData(); }
    catch (err: any) { alert("Failed to delete.\n" + (err.message || err)); }
  };

  const handleInvoiceUpload = async (billId: number, file: File) => {
    setUploadingId(billId);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await purchaseBillService.uploadInvoice(billId, base64, file.name);
        loadData();
        setUploadingId(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("Failed to upload invoice.\n" + (err.message || err));
      setUploadingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Purchase Bills</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">+ New Bill</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1 flex-wrap">
            {STATUS_LIST.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s === "All" ? "All" : s}</button>
            ))}
          </div>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value={0}>All Vendors</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select value={poFilter} onChange={(e) => setPoFilter(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value={0}>All POs</option>
            {purchaseOrders.map((po) => <option key={po.id} value={po.id}>{po.poNumber}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} bill{filtered.length !== 1 ? "s" : ""} found</p>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No purchase bills found.</div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{r.billNo}</p>
                  <p className="text-xs text-gray-400">{r.vendorName}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">PO No</p>
                  <p className="text-sm text-gray-700">{r.poNumber || "—"}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">Bill Date</p>
                  <p className="text-sm text-gray-700">{r.billDate}</p>
                </div>
                <div className="w-24">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status}</span>
                </div>
                <div className="w-32 text-right">
                  <p className="text-xs text-gray-400">Net Amount</p>
                  <p className="text-sm font-bold text-green-600">{fmt(Number(r.netAmount || 0))}</p>
                </div>
                <span className={`text-xs font-bold transition-transform ${expandedId === r.id ? "rotate-90" : ""}`}>&#9654;</span>
              </div>

              {expandedId === r.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div><span className="text-gray-400 text-xs">Vendor Invoice</span><p className="font-semibold">{r.vendorInvoiceNo || "—"}</p></div>
                    <div><span className="text-gray-400 text-xs">Total Bill</span><p className="font-semibold">{fmt(Number(r.totalAmount || 0))}</p></div>
                    <div><span className="text-gray-400 text-xs">Tax</span><p className="font-semibold">{fmt(Number(r.taxAmount || 0))}</p></div>
                    <div><span className="text-gray-400 text-xs">Recovery</span><p className="font-semibold">{fmt(Number(r.recoveryAmount || 0))}</p></div>
                  </div>
                  {r.remarks && <p className="text-xs text-gray-500 mb-3">Remarks: {r.remarks}</p>}

                  {/* Invoice File */}
                  <div className="mb-3">
                    <span className="text-xs text-gray-400">Vendor Invoice File</span>
                    {r.vendorInvoiceFileName ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-gray-700">{r.vendorInvoiceFileName}</span>
                        <button
                          onClick={() => {
                            if (r.vendorInvoiceFile) {
                              const w = window.open();
                              if (w) {
                                w.document.write(`<iframe src="data:application/pdf;base64,${r.vendorInvoiceFile}" width="100%" height="100%" style="border:none;position:absolute;top:0;left:0;right:0;bottom:0;"></iframe>`);
                              }
                            }
                          }}
                          className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >View</button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <label className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 cursor-pointer inline-block">
                          {uploadingId === r.id ? "Uploading..." : "Upload Invoice"}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleInvoiceUpload(r.id, f);
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {r.items && r.items.length > 0 && (
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
                          {r.items.map((item, idx) => (
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
                      </table>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {r.status === "DRAFT" && (
                      <button onClick={() => handleStatusChange(r.id, "SUBMITTED")} className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Submit</button>
                    )}
                    {r.status === "SUBMITTED" && (
                      <>
                        <button onClick={() => handleStatusChange(r.id, "APPROVED")} className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-600 rounded-lg hover:bg-green-100">Approve</button>
                        <button onClick={() => handleStatusChange(r.id, "REJECTED")} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Reject</button>
                      </>
                    )}
                    {r.status === "DRAFT" && (
                      <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
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
              <h2 className="text-lg font-bold text-gray-800">Create Purchase Bill</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vendor <span className="text-red-500">*</span></label>
                  <select value={form.vendorId} onChange={(e) => updateField("vendorId", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select Vendor --</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Purchase Order</label>
                  <select value={form.purchaseOrderId} onChange={(e) => updateField("purchaseOrderId", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- None --</option>
                    {purchaseOrders.filter((po) => !form.vendorId || po.vendorId === form.vendorId).map((po) => (
                      <option key={po.id} value={po.id}>{po.poNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bill Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.billDate} onChange={(e) => updateField("billDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vendor Invoice No</label>
                  <input type="text" value={form.vendorInvoiceNo} onChange={(e) => updateField("vendorInvoiceNo", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vendor Invoice Date</label>
                  <input type="date" value={form.vendorInvoiceDate} onChange={(e) => updateField("vendorInvoiceDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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
                          <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700">{fmt(rowAmount(item))}</td>
                          <td className="px-2 py-1.5 text-center">
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold" title="Remove">&#10005;</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={addItem} className="mt-2 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">+ Add Item</button>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Summary</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Total Amount</label>
                    <p className="text-sm font-bold">{fmt(formTotalAmount)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tax Amount</label>
                    <input type="number" min={0} value={form.taxAmount || ""} onChange={(e) => updateField("taxAmount", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount</label>
                    <input type="number" min={0} value={form.discount || ""} onChange={(e) => updateField("discount", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Freight Charges</label>
                    <input type="number" min={0} value={form.freightCharges || ""} onChange={(e) => updateField("freightCharges", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Recovery Amount</label>
                    <input type="number" min={0} value={form.recoveryAmount || ""} onChange={(e) => updateField("recoveryAmount", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Net Amount</label>
                    <p className="text-sm font-bold text-green-700">{fmt(formNetAmount)}</p>
                  </div>
                </div>
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
