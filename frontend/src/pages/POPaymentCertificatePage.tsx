import { useState, useEffect } from "react";
import { poPaymentService } from "../services/poPaymentService";
import type { POPaymentCertificateDto, CreatePOPaymentCertificateRequest } from "../services/poPaymentService";
import { vendorService } from "../services/vendorService";
import type { VendorDto } from "../services/vendorService";
import { purchaseOrderService } from "../services/purchaseOrderService";
import type { PurchaseOrderDto } from "../services/purchaseOrderService";

const STATUS_LIST = ["All", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const PAYMENT_MODES = ["CASH", "CHEQUE", "WIRE_TRANSFER", "UPI", "NEFT", "RTGS"] as const;

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface PaymentForm {
  vendorId: number;
  purchaseOrderId: number;
  paymentDate: string;
  paymentMode: string;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  totalAmount: number;
  remarks: string;
}

const emptyForm: PaymentForm = {
  vendorId: 0, purchaseOrderId: 0, paymentDate: "", paymentMode: "CASH",
  bankName: "", chequeNo: "", chequeDate: "", totalAmount: 0, remarks: "",
};

export default function POPaymentCertificatePage() {
  const [records, setRecords] = useState<POPaymentCertificateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [form, setForm] = useState<PaymentForm>({ ...emptyForm });

  useEffect(() => { loadData(); loadDropdowns(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setRecords(await poPaymentService.getAll()); } catch (err) { console.error(err); setRecords([]); }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [v, po] = await Promise.all([vendorService.getActive(), purchaseOrderService.getAll()]);
      setVendors(v);
      setPurchaseOrders(po.filter((p) => p.status === "APPROVED"));
    } catch (err) { console.error(err); }
  };

  const filtered = records.filter((r) => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (vendorFilter && r.vendorId !== vendorFilter) return false;
    return true;
  });

  const openCreate = () => { setForm({ ...emptyForm }); setShowModal(true); };

  const updateField = (field: keyof PaymentForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.vendorId) { alert("Please select a Vendor."); return; }
    if (!form.paymentDate) { alert("Payment Date is required."); return; }
    if (!form.totalAmount || form.totalAmount <= 0) { alert("Total Amount must be greater than zero."); return; }

    setSaving(true);
    try {
      const req: CreatePOPaymentCertificateRequest = {
        vendorId: form.vendorId,
        purchaseOrderId: form.purchaseOrderId || undefined,
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode as "CASH" | "CHEQUE" | "WIRE_TRANSFER",
        bankName: form.bankName || undefined,
        chequeNo: form.chequeNo || undefined,
        chequeDate: form.chequeDate || undefined,
        totalAmount: form.totalAmount,
        remarks: form.remarks || undefined,
      };
      await poPaymentService.create(req);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert("Failed to create payment certificate.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try { await poPaymentService.updateStatus(id, newStatus); loadData(); }
    catch (err: any) { alert("Failed to update status.\n" + (err.message || err)); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment certificate?")) return;
    try { await poPaymentService.delete(id); loadData(); }
    catch (err: any) { alert("Failed to delete.\n" + (err.message || err)); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">PO Payment Certificates</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">+ New Payment</button>
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
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} certificate{filtered.length !== 1 ? "s" : ""} found</p>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No payment certificates found.</div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{r.certificateNo}</p>
                  <p className="text-xs text-gray-400">{r.vendorName}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm text-gray-700">{r.paymentDate}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">Mode</p>
                  <p className="text-sm text-gray-700">{r.paymentMode}</p>
                </div>
                <div className="w-24">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status}</span>
                </div>
                <div className="w-32 text-right">
                  <p className="text-sm font-bold text-green-600">{fmt(Number(r.totalAmount || 0))}</p>
                </div>
                <span className={`text-xs font-bold transition-transform ${expandedId === r.id ? "rotate-90" : ""}`}>&#9654;</span>
              </div>

              {expandedId === r.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    {r.bankName && <div><span className="text-gray-400 text-xs">Bank</span><p className="font-semibold">{r.bankName}</p></div>}
                    {r.chequeNo && <div><span className="text-gray-400 text-xs">Cheque No</span><p className="font-semibold">{r.chequeNo}</p></div>}
                    {r.chequeDate && <div><span className="text-gray-400 text-xs">Cheque Date</span><p className="font-semibold">{r.chequeDate}</p></div>}
                    <div><span className="text-gray-400 text-xs">Created By</span><p className="font-semibold">{r.createdBy || "—"}</p></div>
                  </div>
                  {r.remarks && <p className="text-xs text-gray-500 mb-3">Remarks: {r.remarks}</p>}

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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create Payment Certificate</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Payment Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.paymentDate} onChange={(e) => updateField("paymentDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Payment Mode <span className="text-red-500">*</span></label>
                  <select value={form.paymentMode} onChange={(e) => updateField("paymentMode", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>

              {(form.paymentMode === "CHEQUE" || form.paymentMode === "NEFT" || form.paymentMode === "RTGS" || form.paymentMode === "WIRE_TRANSFER") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
                    <input type="text" value={form.bankName} onChange={(e) => updateField("bankName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  {form.paymentMode === "CHEQUE" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cheque No</label>
                        <input type="text" value={form.chequeNo} onChange={(e) => updateField("chequeNo", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cheque Date</label>
                        <input type="date" value={form.chequeDate} onChange={(e) => updateField("chequeDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Total Amount <span className="text-red-500">*</span></label>
                  <input type="number" min={0} value={form.totalAmount || ""} onChange={(e) => updateField("totalAmount", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                  <input type="text" value={form.remarks} onChange={(e) => updateField("remarks", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Remarks" />
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
