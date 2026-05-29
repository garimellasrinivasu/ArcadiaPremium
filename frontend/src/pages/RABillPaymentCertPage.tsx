import { useState, useEffect } from "react";
import { raBillPaymentService } from "../services/raBillPaymentService";
import type {
  RABillPaymentCertificateDto,
  CreateRABillPaymentCertificateRequest,
} from "../services/raBillPaymentService";
import { contractorService } from "../services/contractorService";
import type { ContractorDto } from "../services/contractorService";
import { workOrderService } from "../services/jobService";
import type { WorkOrderDto } from "../services/jobService";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const PAYMENT_MODES = ["CASH", "CHEQUE", "WIRE_TRANSFER"] as const;
const MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  WIRE_TRANSFER: "Wire Transfer",
};

const fmt = (n?: number) => n != null ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₹0.00";

interface PayForm {
  contractorId: number;
  workOrderId: number;
  paymentDate: string;
  paymentMode: string;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  totalAmount: number;
  remarks: string;
}

const emptyForm: PayForm = {
  contractorId: 0, workOrderId: 0, paymentDate: "", paymentMode: "WIRE_TRANSFER",
  bankName: "", chequeNo: "", chequeDate: "", totalAmount: 0, remarks: "",
};

export default function RABillPaymentCertPage() {
  const [payments, setPayments] = useState<RABillPaymentCertificateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [contractors, setContractors] = useState<ContractorDto[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
  const [filterContractor, setFilterContractor] = useState(0);

  const [form, setForm] = useState<PayForm>({ ...emptyForm });

  useEffect(() => {
    loadPayments();
    loadDropdowns();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try { setPayments(await raBillPaymentService.getAll()); } catch { setPayments([]); }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [c, w] = await Promise.all([contractorService.getActive(), workOrderService.getAll()]);
      setContractors(c); setWorkOrders(w);
    } catch (err) { console.error(err); }
  };

  const filtered = filterContractor ? payments.filter((p) => p.contractorId === filterContractor) : payments;

  const openCreate = () => { setForm({ ...emptyForm }); setShowModal(true); };

  const updateFormField = (field: keyof PayForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.contractorId) { alert("Please select a Contractor."); return; }
    if (!form.workOrderId) { alert("Please select a Work Order."); return; }
    if (!form.paymentDate) { alert("Payment Date is required."); return; }
    if (!form.totalAmount || form.totalAmount <= 0) { alert("Amount must be greater than 0."); return; }

    setSaving(true);
    try {
      const req: CreateRABillPaymentCertificateRequest = {
        contractorId: form.contractorId,
        workOrderId: form.workOrderId,
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode as any,
        bankName: form.bankName || undefined,
        chequeNo: form.chequeNo || undefined,
        chequeDate: form.chequeDate || undefined,
        totalAmount: form.totalAmount,
        remarks: form.remarks || undefined,
      };
      await raBillPaymentService.create(req);
      setShowModal(false);
      loadPayments();
    } catch (err: any) {
      alert("Failed to create payment.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try { await raBillPaymentService.updateStatus(id, newStatus); loadPayments(); }
    catch (err: any) { alert("Failed to update status.\n" + (err.message || err)); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this payment certificate?")) return;
    try { await raBillPaymentService.delete(id); loadPayments(); }
    catch (err: any) { alert("Failed to delete.\n" + (err.message || err)); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">RA Bill Payment Certificates</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
          + New Payment
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-60">
            <label className="block text-xs text-gray-500 mb-1">Filter by Contractor</label>
            <select value={filterContractor} onChange={(e) => setFilterContractor(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value={0}>All Contractors</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <p className="text-sm text-gray-500 ml-auto">{filtered.length} payment(s) found</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No payment certificates found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Certificate No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Contractor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">WO No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mode</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pay) => (
                  <tr key={pay.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{pay.certificateNo}</td>
                    <td className="px-4 py-3 text-gray-700">{pay.contractorName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{pay.woNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{pay.paymentDate}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-700">
                        {MODE_LABELS[pay.paymentMode] || pay.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(pay.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <select value={pay.status} onChange={(e) => handleStatusChange(pay.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold rounded-lg border ${STATUS_COLORS[pay.status] || "bg-gray-100 text-gray-700"}`}>
                        {["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(pay.id)}
                        className="px-2 py-1 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create Payment Certificate</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Contractor <span className="text-red-500">*</span></label>
                <select value={form.contractorId} onChange={(e) => updateFormField("contractorId", Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value={0}>-- Select Contractor --</option>
                  {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Work Order <span className="text-red-500">*</span></label>
                <select value={form.workOrderId} onChange={(e) => updateFormField("workOrderId", Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value={0}>-- Select WO --</option>
                  {workOrders.map((wo) => <option key={wo.id} value={wo.id}>{wo.woNumber} - {wo.contractorName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Payment Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.paymentDate} onChange={(e) => updateFormField("paymentDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={(e) => updateFormField("paymentMode", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    {PAYMENT_MODES.map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
                  </select>
                </div>
              </div>

              {/* Cheque-specific fields */}
              {form.paymentMode === "CHEQUE" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
                    <input type="text" value={form.bankName} onChange={(e) => updateFormField("bankName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cheque No</label>
                    <input type="text" value={form.chequeNo} onChange={(e) => updateFormField("chequeNo", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cheque Date</label>
                    <input type="date" value={form.chequeDate} onChange={(e) => updateFormField("chequeDate", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              )}

              {/* Bank name for wire transfer */}
              {form.paymentMode === "WIRE_TRANSFER" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
                  <input type="text" value={form.bankName} onChange={(e) => updateFormField("bankName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Total Amount <span className="text-red-500">*</span></label>
                <input type="number" min={0} step={0.01} value={form.totalAmount || ""}
                  onChange={(e) => updateFormField("totalAmount", Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => updateFormField("remarks", e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
