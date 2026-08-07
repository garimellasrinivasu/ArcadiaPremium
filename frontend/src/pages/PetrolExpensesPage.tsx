import { useEffect, useState, useRef } from "react";
import { useDownloadEnabled } from "../components/ViewOnlyWrapper";
import { authService } from "../services/authService";
import { pujaExpensesService } from "../services/pujaExpensesService";
import type { PujaExpenseDto, CreatePujaExpenseRequest } from "../services/pujaExpensesService";

/* ═══════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════ */

const DEFAULT_CATEGORIES = [
  "Petrol",
  "Diesel",
  "Vehicle Maintenance",
  "Tyre Repair / Replacement",
  "Oil & Lubricants",
  "Vehicle Insurance",
  "Toll Charges",
  "Parking",
  "Driver Allowance",
  "Miscellaneous",
];

const PAYMENT_MODES = [
  "Cash",
  "UPI / Google Pay",
  "Bank Transfer / NEFT",
  "Cheque",
  "Credit Card",
  "Company Account",
];

const PAID_BY_OPTIONS = [
  "Company",
  "Garimella Srinivasu",
  "Suresh K",
  "Prakash N",
  "Shiva",
  "Rajesh",
  "Subbu",
];

const PARTNERS = [
  "Garimella Srinivasu",
  "Suresh K",
  "Prakash N",
];

const DEFAULT_NOTES =
  "Vehicle fuel, maintenance, and transportation expenses for project operations. Below is the detailed statement of expenses incurred, submitted for review and approval.";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateDisplay(isoDate: string) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return isoDate;
  }
}

/* ═══════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════ */

export default function PetrolExpensesPage() {
  const downloadEnabled = useDownloadEnabled();
  // Data
  const [expenses, setExpenses] = useState<PujaExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Info fields
  const [projectName, setProjectName] = useState("Praneeth Pranav Arcadia Premium");
  const [pujaDate, setPujaDate] = useState(new Date().toISOString().split("T")[0]);
  const [preparedBy, setPreparedBy] = useState("");
  const [notes, setNotes] = useState(DEFAULT_NOTES);

  // Categories
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Form
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [paidBy, setPaidBy] = useState("Company");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [payeeName, setPayeeName] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Partners
  const [selectedPartners, setSelectedPartners] = useState<string[]>(
    PARTNERS.slice(0, 3)
  );

  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  // Load data on mount
  useEffect(() => {
    loadExpenses();
    authService
      .getCurrentUser()
      .then((user) => {
        if (user) {
          setPreparedBy(`${user.firstName} ${user.lastName}`);
        }
      })
      .catch(() => {});
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      const data = await pujaExpensesService.getByPujaName("Petrol Expenses");
      setExpenses(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category summary
  const categorySummary = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const categoryEntries = Object.entries(categorySummary);

  function resetForm() {
    setCategory("");
    setDescription("");
    setVendor("");
    setAmount("");
    setPaidBy("Company");
    setPaymentMode("Cash");
    setPaymentStatus("Paid");
    setPayeeName("");
    setReceiptNo("");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !amount) return;

    const req: CreatePujaExpenseRequest = {
      pujaName: "Petrol Expenses",
      pujaDate,
      category,
      description,
      vendor,
      amount: Number(amount),
      paymentStatus,
      paidBy,
      paymentMode,
      receiptNo,
      payeeName,
      projectName,
      notes,
      preparedBy,
    };

    try {
      setError("");
      if (editingId !== null) {
        await pujaExpensesService.update(editingId, req);
      } else {
        await pujaExpensesService.create(req);
      }
      resetForm();
      await loadExpenses();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to save expense";
      setError(msg);
    }
  }

  function handleEdit(exp: PujaExpenseDto) {
    setEditingId(exp.id);
    setCategory(exp.category);
    setDescription(exp.description);
    setVendor(exp.vendor);
    setAmount(exp.amount);
    setPaidBy(exp.paidBy || "");
    setPaymentStatus(exp.paymentStatus || "Paid");
    setPayeeName(exp.payeeName || "");
    setPaymentMode(exp.paymentMode);
    setReceiptNo(exp.receiptNo);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      setError("");
      await pujaExpensesService.delete(id);
      await loadExpenses();
    } catch (err: any) {
      const msg = err?.response?.status === 403
        ? "Access denied: You do not have permission to delete expenses"
        : err?.response?.data?.error || err?.message || "Failed to delete expense";
      setError(msg);
    }
  }

  function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategoryName("");
      setShowNewCategory(false);
    }
  }

  function togglePartner(name: string) {
    if (selectedPartners.includes(name)) {
      setSelectedPartners(selectedPartners.filter((p) => p !== name));
    } else if (selectedPartners.length < 3) {
      setSelectedPartners([...selectedPartners, name]);
    }
  }

  /* ── Export Excel ── */
  function handleExportExcel() {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/><style>td,th{border:1px solid #999;padding:6px 10px;font-family:Arial}th{background:#1e3a5f;color:#fff;font-weight:bold}.title{font-size:18px;font-weight:bold;color:#1e3a5f}.sub{font-size:14px;color:#555}.total{font-weight:bold;background:#DBEAFE}.right{text-align:right}</style></head><body>`;
    html += `<table>`;
    html += `<tr><td colspan="9" class="title">Petrol & Vehicle Expenses - Expense Statement</td></tr>`;
    html += `<tr><td colspan="9" class="sub">Praneeth Pranav Arcadia Premium</td></tr>`;
    html += `<tr><td colspan="9"></td></tr>`;
    html += `<tr><td><b>Project Name:</b></td><td colspan="6">${projectName}</td></tr>`;
    html += `<tr><td><b>Date:</b></td><td colspan="6">${formatDateDisplay(pujaDate)}</td></tr>`;
    html += `<tr><td><b>Prepared By:</b></td><td colspan="6">${preparedBy}</td></tr>`;
    html += `<tr><td colspan="9"></td></tr>`;
    html += `<tr><td colspan="9"><b>Notes / Description:</b></td></tr>`;
    html += `<tr><td colspan="9">${notes}</td></tr>`;
    html += `<tr><td colspan="9"></td></tr>`;
    html += `<tr><th>S.No</th><th>Category</th><th>Description</th><th>Vendor / Paid To</th><th>Amount</th><th>Status</th><th>Paid By / Payee</th><th>Payment Mode</th><th>Receipt / Bill No</th></tr>`;
    expenses.forEach((exp, i) => {
      html += `<tr><td>${i + 1}</td><td>${exp.category}</td><td>${exp.description || ""}</td><td>${exp.vendor || ""}</td><td class="right">${exp.amount}</td><td>${(!exp.paymentStatus || exp.paymentStatus === "Paid") ? "Paid" : "Pending"}</td><td>${(!exp.paymentStatus || exp.paymentStatus === "Paid") ? (exp.paidBy || "") : (exp.payeeName ? "Pay to: " + exp.payeeName : "Pending")}</td><td>${(!exp.paymentStatus || exp.paymentStatus === "Paid") ? (exp.paymentMode || "") : "-"}</td><td>${(!exp.paymentStatus || exp.paymentStatus === "Paid") ? (exp.receiptNo || "") : "-"}</td></tr>`;
    });
    html += `<tr class="total"><td colspan="6" class="right">Total:</td><td class="right">${totalExpenses}</td><td colspan="2"></td></tr>`;
    html += `<tr><td colspan="9"></td></tr>`;

    if (categoryEntries.length > 1) {
      html += `<tr><td colspan="9" class="title" style="font-size:14px">Category Summary</td></tr>`;
      html += `<tr><th>Category</th><th class="right">Total</th><th colspan="5"></th></tr>`;
      categoryEntries.forEach(([cat, total]) => {
        html += `<tr><td>${cat}</td><td class="right">${total}</td><td colspan="5"></td></tr>`;
      });
      html += `<tr><td colspan="9"></td></tr>`;
    }

    html += `<tr><td colspan="9" class="title" style="font-size:14px">Approval Section</td></tr>`;
    selectedPartners.forEach((p) => {
      html += `<tr><td colspan="3">${p}</td><td colspan="4">Signature: ____________________</td></tr>`;
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Petrol_Vehicle_Expenses_Statement.xls";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ── Print ── */
  function handlePrint() {
    const tableRows = expenses
      .map(
        (exp, i) => `
        <tr style="border-bottom:1px solid #e5e7eb;${i % 2 === 1 ? "background:#eff6ff;" : ""}">
          <td style="padding:8px;text-align:center;">${i + 1}</td>
          <td style="padding:8px;">${exp.category}</td>
          <td style="padding:8px;">${exp.description}</td>
          <td style="padding:8px;">${exp.vendor}</td>
          <td style="padding:8px;text-align:right;font-family:monospace;">${formatINR(exp.amount)}</td>
          <td style="padding:8px;">${exp.paidBy || ""}</td>
          <td style="padding:8px;">${exp.paymentMode}</td>
          <td style="padding:8px;">${exp.receiptNo}</td>
        </tr>`
      )
      .join("");

    const categorySummaryHTML =
      categoryEntries.length > 1
        ? `<h3 style="margin-top:24px;color:#1e3a8a;">Category Summary</h3>
           <table style="width:50%;border-collapse:collapse;margin-top:8px;">
             <thead><tr style="background:#1e3a8a;color:white;">
               <th style="padding:8px;text-align:left;">Category</th>
               <th style="padding:8px;text-align:right;">Total</th>
             </tr></thead>
             <tbody>${categoryEntries
               .map(
                 ([cat, total]) =>
                   `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px;">${cat}</td><td style="padding:8px;text-align:right;font-family:monospace;">${formatINR(total)}</td></tr>`
               )
               .join("")}
             </tbody>
           </table>`
        : "";

    const signaturesHTML = selectedPartners
      .map(
        (p) => `
        <div style="display:inline-block;width:30%;text-align:center;margin:20px 1%;">
          <div style="border-top:2px solid #1e3a8a;padding-top:8px;margin-top:60px;">
            <strong>${p}</strong><br/>
            <span style="color:#666;font-size:12px;">Partner</span>
          </div>
        </div>`
      )
      .join("");

    const html = `
      <html><head><title>Petrol & Vehicle Expenses Statement</title></head>
      <body style="font-family:Arial,sans-serif;padding:40px;color:#333;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#1e3a8a;margin-bottom:4px;">Petrol & Vehicle Expenses - Expense Statement</h1>
          <h3 style="color:#1e40af;">Praneeth Pranav Arcadia Premium</h3>
        </div>
        <div style="margin-bottom:16px;">
          <p><strong>Project Name:</strong> ${projectName}</p>
          <p><strong>Date:</strong> ${formatDateDisplay(pujaDate)}</p>
          <p><strong>Prepared By:</strong> ${preparedBy}</p>
        </div>
        <div style="background:#eff6ff;padding:12px 16px;border-left:4px solid #2563eb;margin-bottom:24px;">
          <p style="margin:0;">${notes}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1e3a8a;color:white;">
              <th style="padding:8px;">S.No</th>
              <th style="padding:8px;text-align:left;">Category</th>
              <th style="padding:8px;text-align:left;">Description</th>
              <th style="padding:8px;text-align:left;">Vendor / Paid To</th>
              <th style="padding:8px;text-align:right;">Amount</th>
              <th style="padding:8px;text-align:left;">Paid By</th>
              <th style="padding:8px;text-align:left;">Payment Mode</th>
              <th style="padding:8px;text-align:left;">Receipt / Bill No</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr style="border-top:3px solid #1e3a8a;font-weight:bold;background:#dbeafe;">
              <td colspan="5" style="padding:10px;text-align:right;font-size:15px;">Grand Total:</td>
              <td style="padding:10px;text-align:right;font-family:monospace;font-size:15px;">${formatINR(totalExpenses)}</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
        ${categorySummaryHTML}
        <div style="margin-top:40px;">
          <h3 style="color:#1e3a8a;">Approved By</h3>
          ${signaturesHTML}
        </div>
      </body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  }

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Back Link ── */}
      <div>
        <a
          href="/activities/expenses"
          className="text-blue-900 hover:text-blue-700 text-sm font-medium"
        >
          &larr; Back to Expenses Summary
        </a>
      </div>

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white rounded-xl p-6 text-center shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
          Petrol & Vehicle Expenses
        </h1>
        <p className="text-blue-200 mt-1 text-sm md:text-base">
          Praneeth Pranav Arcadia Premium
        </p>
      </div>

      {/* ── Info Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-1">
              Project Name
            </label>
            <input
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-1">
              Date
            </label>
            <input
              type="date"
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={pujaDate}
              onChange={(e) => setPujaDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-1">
              Prepared By
            </label>
            <input
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-lg shadow p-6 flex flex-col items-center justify-center">
          <span className="text-sm uppercase tracking-widest text-blue-300 mb-1">
            Total Expenses
          </span>
          <span className="text-3xl md:text-4xl font-bold">
            {formatINR(totalExpenses)}
          </span>
          <span className="text-blue-300 text-xs mt-1">
            {expenses.length} item{expenses.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Notes / Description ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-4">
        <label className="block text-sm font-semibold text-blue-900 mb-2">
          Notes / Description
        </label>
        <textarea
          className="w-full border border-blue-300 bg-blue-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[100px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold ml-4">&times;</button>
        </div>
      )}

      {/* ── Add / Edit Expense Form ── */}
      <div ref={formRef} className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-bold text-blue-900 mb-4">
          {editingId !== null ? "Edit Expense" : "Add Expense"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="px-3 py-2 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 font-bold text-lg leading-none"
                  title="Add new category"
                >
                  +
                </button>
              </div>
              {showNewCategory && (
                <div className="flex gap-2 mt-2">
                  <input
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Vendor / Paid To
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Vendor name"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Amount (INR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="0"
                required
                min={0}
              />
            </div>

            {/* Payment Status */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payment Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentStatus"
                    value="Paid"
                    checked={paymentStatus === "Paid"}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-green-700">Paid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentStatus"
                    value="Pending"
                    checked={paymentStatus === "Pending"}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-red-700">Pending</span>
                </label>
              </div>
            </div>

            {paymentStatus === "Paid" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Paid By
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {PAID_BY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {paymentStatus === "Pending" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  To Whom to Pay
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="Enter name / vendor to pay"
                />
              </div>
            )}

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payment Mode
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="">-- Select --</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Receipt No */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Receipt / Bill No
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="Receipt number"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-semibold text-sm shadow"
            >
              {editingId !== null ? "Update Expense" : "Add Expense"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Expense Table ── */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-blue-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-blue-900">Expense Details</h2>
          <div className="flex gap-2">
            {downloadEnabled && (
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow"
            >
              Export Excel
            </button>
            )}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow"
            >
              Print
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No expenses added yet. Use the form above to add expenses.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="px-4 py-3 text-left font-semibold">S.No</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Vendor / Paid To</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Paid By / Payee</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment Mode</th>
                  <th className="px-4 py-3 text-left font-semibold">Receipt No</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <tr
                    key={exp.id}
                    className={`border-b border-gray-100 hover:bg-blue-50 transition ${
                      i % 2 === 1 ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-center text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">{exp.category}</td>
                    <td className="px-4 py-3 text-gray-600">{exp.description}</td>
                    <td className="px-4 py-3 text-gray-600">{exp.vendor}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(!exp.paymentStatus || exp.paymentStatus === "Paid") ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Paid</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(!exp.paymentStatus || exp.paymentStatus === "Paid")
                        ? (exp.paidBy || "-")
                        : (<span className="text-red-600 font-medium">{exp.payeeName ? `Pay to: ${exp.payeeName}` : "Payment Pending"}</span>)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(!exp.paymentStatus || exp.paymentStatus === "Paid") ? (exp.paymentMode || "-") : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(!exp.paymentStatus || exp.paymentStatus === "Paid") ? (exp.receiptNo || "-") : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEdit(exp)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 inline"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 inline"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-blue-100 border-t-4 border-blue-900 font-bold">
                  <td colSpan={6} className="px-4 py-3 text-right text-blue-900 text-base">
                    Grand Total:
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-blue-900 text-base">
                    {formatINR(totalExpenses)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Category Summary ── */}
      {categoryEntries.length > 1 && (
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-bold text-blue-900 mb-3">Category Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryEntries.map(([cat, total]) => (
              <div
                key={cat}
                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-700 truncate mr-2">
                  {cat}
                </span>
                <span className="text-sm font-bold text-blue-900 font-mono whitespace-nowrap">
                  {formatINR(total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Partner Approval Section ── */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-bold text-blue-900 mb-2">Partner Approval</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select up to 3 partners for approval signatures.
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {PARTNERS.map((partner) => {
            const isSelected = selectedPartners.includes(partner);
            return (
              <button
                key={partner}
                type="button"
                onClick={() => togglePartner(partner)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                  isSelected
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-900"
                } ${
                  !isSelected && selectedPartners.length >= 3
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }`}
                disabled={!isSelected && selectedPartners.length >= 3}
              >
                {partner}
              </button>
            );
          })}
        </div>

        {selectedPartners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-blue-200">
            {selectedPartners.map((partner) => (
              <div key={partner} className="text-center">
                <div className="h-20 border-b-2 border-blue-900 mb-2"></div>
                <p className="font-semibold text-blue-900">{partner}</p>
                <p className="text-xs text-gray-500">Partner</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
