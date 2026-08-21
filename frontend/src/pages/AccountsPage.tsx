import { useEffect, useState, useRef } from "react";
import { useProject, PROJECTS } from "../contexts/ProjectContext";
import { useDownloadEnabled } from "../components/ViewOnlyWrapper";
import {
  accountService,
  type AccountCategoryDto,
  type AccountEntryDto,
  type AccountInvoiceDto,
  type AccountPaymentDto,
  type AccountSummaryDto,
  type VendorTotalDto,
  type CategoryTotalDto,
} from "../services/accountService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
// @ts-ignore
} from "recharts";

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const CHART_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
  "#e11d48", "#84cc16",
];

/* ═══════════════════════════════════════════
   TAB TYPE
   ═══════════════════════════════════════════ */

type TabKey = "ledger" | "summaries" | "analytics";

const TAB_LABELS: Record<TabKey, string> = {
  ledger: "Ledger",
  summaries: "Summaries",
  analytics: "Analytics",
};

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function AccountsPage() {
  const { activeProject, setPageProject } = useProject();
  const downloadEnabled = useDownloadEnabled();
  const [tab, setTab] = useState<TabKey>("ledger");
  const [refreshKey, setRefreshKey] = useState(0);

  const projectName = activeProject.name;

  function triggerRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-800">Accounts Ledger</h1>

      {/* Project Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
          <select
            value={activeProject.key}
            onChange={(e) => {
              const p = PROJECTS.find((pr) => pr.key === e.target.value);
              if (p) setPageProject(p);
            }}
            className="px-3 py-2 border rounded-lg text-sm min-w-[220px]"
          >
            {PROJECTS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t
                ? "bg-arcadia-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "ledger" && (
        <LedgerTab
          key={`ledger-${refreshKey}`}
          projectName={projectName}
          downloadEnabled={downloadEnabled}
          onRefresh={triggerRefresh}
        />
      )}
      {tab === "summaries" && (
        <SummariesTab key={`summaries-${refreshKey}`} projectName={projectName} />
      )}
      {tab === "analytics" && (
        <AnalyticsTab key={`analytics-${refreshKey}`} projectName={projectName} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   LEDGER TAB
   ═══════════════════════════════════════════ */

function LedgerTab({
  projectName,
  downloadEnabled,
  onRefresh,
}: {
  projectName: string;
  downloadEnabled: boolean;
  onRefresh: () => void;
}) {
  const [categories, setCategories] = useState<AccountCategoryDto[]>([]);
  const [entries, setEntries] = useState<AccountEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Collapsed state per category
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  // Expanded entry (show invoices/payments)
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Edit targets
  const [_editCategory, setEditCategory] = useState<AccountCategoryDto | null>(null);
  const [editEntry, setEditEntry] = useState<AccountEntryDto | null>(null);
  const [entryForCategory, setEntryForCategory] = useState<number | null>(null);
  const [editInvoice, setEditInvoice] = useState<AccountInvoiceDto | null>(null);
  const [editPayment, setEditPayment] = useState<AccountPaymentDto | null>(null);
  const [invoiceEntryId, setInvoiceEntryId] = useState<number | null>(null);
  const [paymentEntryId, setPaymentEntryId] = useState<number | null>(null);

  // Import
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "entry" | "invoice" | "payment";
    id: number;
    label: string;
  } | null>(null);

  function loadData() {
    setLoading(true);
    setError("");
    Promise.all([
      accountService.getCategories(projectName),
      accountService.getLedger(projectName),
    ])
      .then(([cats, ents]) => {
        setCategories(cats.sort((a, b) => a.sortOrder - b.sortOrder));
        setEntries(ents);
      })
      .catch((err) => {
        console.error("Accounts load error:", err);
        const msg = err?.response?.data?.message || err?.response?.statusText || err?.message || "Unknown error";
        const status = err?.response?.status;
        setError("Failed to load data" + (status ? ` (${status}: ${msg})` : `: ${msg}`));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [projectName]);

  function toggleCollapse(catId: number) {
    setCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  function entriesForCategory(catId: number): AccountEntryDto[] {
    return entries
      .filter((e) => e.categoryId === catId)
      .sort((a, b) => a.serialNumber - b.serialNumber);
  }

  function categoryTotal(catId: number) {
    const list = entriesForCategory(catId);
    return {
      invoiced: list.reduce((s, e) => s + e.totalInvoiced, 0),
      paid: list.reduce((s, e) => s + e.totalPaid, 0),
      balance: list.reduce((s, e) => s + e.balancePayable, 0),
    };
  }

  const grandTotal = {
    invoiced: entries.reduce((s, e) => s + e.totalInvoiced, 0),
    paid: entries.reduce((s, e) => s + e.totalPaid, 0),
    balance: entries.reduce((s, e) => s + e.balancePayable, 0),
  };

  // --- Import Excel ---
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    try {
      const result = await accountService.importExcel(projectName, file);
      setImportMsg(`Successfully imported ${result.imported} entries`);
      loadData();
      onRefresh();
    } catch (err: any) {
      const detail = err?.response?.data?.message || err?.message || "";
      setImportMsg("Import failed. " + (detail || "Please check the file format."));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // --- Export Excel ---
  async function handleExport() {
    try {
      await accountService.exportExcel(projectName);
    } catch {
      setError("Export failed");
    }
  }

  // --- Delete handler ---
  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      switch (deleteConfirm.type) {
        case "category":
          await accountService.deleteCategory(deleteConfirm.id);
          break;
        case "entry":
          await accountService.deleteEntry(deleteConfirm.id);
          break;
        case "invoice":
          await accountService.deleteInvoice(deleteConfirm.id);
          break;
        case "payment":
          await accountService.deletePayment(deleteConfirm.id);
          break;
      }
      setDeleteConfirm(null);
      loadData();
    } catch {
      setError("Delete failed");
      setDeleteConfirm(null);
    }
  }

  if (loading) {
    return <p className="text-gray-400 text-center py-12">Loading ledger...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setEditCategory(null);
            setShowCategoryModal(true);
          }}
          className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 font-medium"
        >
          Manage Categories
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="px-4 py-2 text-sm border border-arcadia-600 text-arcadia-700 rounded-lg hover:bg-arcadia-50 font-medium disabled:opacity-50"
        >
          {importing ? "Importing..." : "Import Excel"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="hidden"
        />
        {downloadEnabled && (
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm border border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-medium"
          >
            Export Excel
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}
      {importMsg && (
        <div className={`px-4 py-3 text-sm rounded-lg border ${importMsg.startsWith("Import failed") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
          {importMsg}
        </div>
      )}

      {/* Grand Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Total Invoiced</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(grandTotal.invoiced)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Total Paid</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(grandTotal.paid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Balance Payable</p>
          <p className={`text-xl font-bold mt-1 ${grandTotal.balance > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(grandTotal.balance)}
          </p>
        </div>
      </div>

      {/* Category Sections */}
      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No categories yet</p>
          <p className="text-sm mt-2">Click "Manage Categories" to add categories like Suppliers, Labourers, etc.</p>
        </div>
      ) : (
        categories.map((cat) => {
          const catEntries = entriesForCategory(cat.id!);
          const totals = categoryTotal(cat.id!);
          const isCollapsed = collapsed[cat.id!];

          return (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Category Header */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => toggleCollapse(cat.id!)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-arcadia-700">{cat.code}.</span>
                  <span className="font-semibold text-gray-800">{cat.name}</span>
                  <span className="text-xs text-gray-400">({catEntries.length} entries)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Inv: <span className="font-medium text-gray-700">{formatCurrency(totals.invoiced)}</span>
                    </span>
                    <span className="text-gray-500">
                      Paid: <span className="font-medium text-green-600">{formatCurrency(totals.paid)}</span>
                    </span>
                    <span className={`font-medium ${totals.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      Bal: {formatCurrency(totals.balance)}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Category Body */}
              {!isCollapsed && (
                <div className="p-4">
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntryForCategory(cat.id!);
                        setEditEntry(null);
                        setShowEntryModal(true);
                      }}
                      className="px-3 py-1.5 text-xs bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 font-medium"
                    >
                      + Add Entry
                    </button>
                  </div>

                  {catEntries.length === 0 ? (
                    <p className="text-center py-6 text-gray-400 text-sm">
                      No entries in this category yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left">S.No</th>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Item/Work</th>
                            <th className="px-3 py-2 text-right">Invoiced</th>
                            <th className="px-3 py-2 text-right">Paid</th>
                            <th className="px-3 py-2 text-right">Balance</th>
                            <th className="px-3 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catEntries.map((entry) => (
                            <EntryRow
                              key={entry.id}
                              entry={entry}
                              isExpanded={expandedEntry === entry.id}
                              onToggleExpand={() =>
                                setExpandedEntry(expandedEntry === entry.id ? null : entry.id!)
                              }
                              onEdit={() => {
                                setEditEntry(entry);
                                setEntryForCategory(cat.id!);
                                setShowEntryModal(true);
                              }}
                              onDelete={() =>
                                setDeleteConfirm({
                                  type: "entry",
                                  id: entry.id!,
                                  label: entry.name,
                                })
                              }
                              onAddInvoice={() => {
                                setInvoiceEntryId(entry.id!);
                                setEditInvoice(null);
                                setShowInvoiceModal(true);
                              }}
                              onEditInvoice={(inv) => {
                                setInvoiceEntryId(entry.id!);
                                setEditInvoice(inv);
                                setShowInvoiceModal(true);
                              }}
                              onDeleteInvoice={(inv) =>
                                setDeleteConfirm({
                                  type: "invoice",
                                  id: inv.id!,
                                  label: `Invoice ${formatCurrency(inv.amount)}`,
                                })
                              }
                              onAddPayment={() => {
                                setPaymentEntryId(entry.id!);
                                setEditPayment(null);
                                setShowPaymentModal(true);
                              }}
                              onEditPayment={(pay) => {
                                setPaymentEntryId(entry.id!);
                                setEditPayment(pay);
                                setShowPaymentModal(true);
                              }}
                              onDeletePayment={(pay) =>
                                setDeleteConfirm({
                                  type: "payment",
                                  id: pay.id!,
                                  label: `Payment ${formatCurrency(pay.amount)}`,
                                })
                              }
                            />
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                          <tr>
                            <td className="px-3 py-2" colSpan={3}>
                              Subtotal
                            </td>
                            <td className="px-3 py-2 text-right">{formatCurrency(totals.invoiced)}</td>
                            <td className="px-3 py-2 text-right text-green-600">
                              {formatCurrency(totals.paid)}
                            </td>
                            <td
                              className={`px-3 py-2 text-right ${
                                totals.balance > 0 ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {formatCurrency(totals.balance)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ----- Modals ----- */}

      {showCategoryModal && (
        <CategoryManageModal
          projectName={projectName}
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onSaved={() => {
            setShowCategoryModal(false);
            loadData();
          }}
          onDelete={(id, name) => {
            setDeleteConfirm({ type: "category", id, label: name });
          }}
        />
      )}

      {showEntryModal && entryForCategory != null && (
        <EntryModal
          projectName={projectName}
          categoryId={entryForCategory}
          entry={editEntry}
          nextSerial={
            editEntry
              ? editEntry.serialNumber
              : entriesForCategory(entryForCategory).length + 1
          }
          onClose={() => setShowEntryModal(false)}
          onSaved={() => {
            setShowEntryModal(false);
            loadData();
          }}
        />
      )}

      {showInvoiceModal && invoiceEntryId != null && (
        <InvoiceModal
          entryId={invoiceEntryId}
          invoice={editInvoice}
          onClose={() => setShowInvoiceModal(false)}
          onSaved={() => {
            setShowInvoiceModal(false);
            loadData();
          }}
        />
      )}

      {showPaymentModal && paymentEntryId != null && (
        <PaymentModal
          entryId={paymentEntryId}
          payment={editPayment}
          onClose={() => setShowPaymentModal(false)}
          onSaved={() => {
            setShowPaymentModal(false);
            loadData();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteConfirm.label}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ENTRY ROW (with expandable details)
   ═══════════════════════════════════════════ */

function EntryRow({
  entry,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}: {
  entry: AccountEntryDto;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddInvoice: () => void;
  onEditInvoice: (inv: AccountInvoiceDto) => void;
  onDeleteInvoice: (inv: AccountInvoiceDto) => void;
  onAddPayment: () => void;
  onEditPayment: (pay: AccountPaymentDto) => void;
  onDeletePayment: (pay: AccountPaymentDto) => void;
}) {
  return (
    <>
      <tr
        className="border-t hover:bg-gray-50 cursor-pointer"
        onClick={onToggleExpand}
      >
        <td className="px-3 py-2">{entry.serialNumber}</td>
        <td className="px-3 py-2 font-medium">{entry.name}</td>
        <td className="px-3 py-2 text-gray-600">{entry.itemWork || "---"}</td>
        <td className="px-3 py-2 text-right">{formatCurrency(entry.totalInvoiced)}</td>
        <td className="px-3 py-2 text-right text-green-700">{formatCurrency(entry.totalPaid)}</td>
        <td
          className={`px-3 py-2 text-right font-medium ${
            entry.balancePayable > 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {formatCurrency(entry.balancePayable)}
        </td>
        <td className="px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-2 py-1 text-xs text-arcadia-600 hover:bg-arcadia-50 rounded"
              title="Edit entry"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              title="Delete entry"
            >
              Del
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Detail */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-blue-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Invoices */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Invoices</h4>
                  <button
                    onClick={onAddInvoice}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Add Invoice
                  </button>
                </div>
                {entry.invoices && entry.invoices.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-2 py-1 text-left">Date</th>
                        <th className="px-2 py-1 text-right">Amount</th>
                        <th className="px-2 py-1 text-left">Description</th>
                        <th className="px-2 py-1 text-center">Act</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.invoices.map((inv) => (
                        <tr key={inv.id} className="border-t">
                          <td className="px-2 py-1">{formatDate(inv.invoiceDate)}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(inv.amount)}</td>
                          <td className="px-2 py-1 text-gray-500">{inv.description || "---"}</td>
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={() => onEditInvoice(inv)}
                              className="text-arcadia-600 hover:underline mr-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteInvoice(inv)}
                              className="text-red-500 hover:underline"
                            >
                              Del
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-400 py-2">No invoices yet</p>
                )}
              </div>

              {/* Payments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Payments</h4>
                  <button
                    onClick={onAddPayment}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Add Payment
                  </button>
                </div>
                {entry.payments && entry.payments.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-2 py-1 text-left">Date</th>
                        <th className="px-2 py-1 text-right">Amount</th>
                        <th className="px-2 py-1 text-left">Description</th>
                        <th className="px-2 py-1 text-center">Act</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.payments.map((pay) => (
                        <tr key={pay.id} className="border-t">
                          <td className="px-2 py-1">{formatDate(pay.paymentDate)}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(pay.amount)}</td>
                          <td className="px-2 py-1 text-gray-500">{pay.description || "---"}</td>
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={() => onEditPayment(pay)}
                              className="text-arcadia-600 hover:underline mr-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeletePayment(pay)}
                              className="text-red-500 hover:underline"
                            >
                              Del
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-400 py-2">No payments yet</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   CATEGORY MANAGE MODAL
   ═══════════════════════════════════════════ */

function CategoryManageModal({
  projectName,
  categories,
  onClose,
  onSaved,
  onDelete,
}: {
  projectName: string;
  categories: AccountCategoryDto[];
  onClose: () => void;
  onSaved: () => void;
  onDelete: (id: number, name: string) => void;
}) {
  const [form, setForm] = useState<{ code: string; name: string; sortOrder: number }>({
    code: "",
    name: "",
    sortOrder: categories.length + 1,
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit(cat: AccountCategoryDto) {
    setEditId(cat.id!);
    setForm({ code: cat.code, name: cat.name, sortOrder: cat.sortOrder });
  }

  function clearForm() {
    setEditId(null);
    setForm({ code: "", name: "", sortOrder: categories.length + 1 });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setError("Code and Name are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const dto: AccountCategoryDto = {
        projectName,
        code: form.code.trim(),
        name: form.name.trim(),
        sortOrder: form.sortOrder,
      };
      if (editId) {
        await accountService.updateCategory(editId, dto);
      } else {
        await accountService.createCategory(dto);
      }
      onSaved();
    } catch {
      setError("Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Manage Categories</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-3">
            {error}
          </div>
        )}

        {/* Existing categories */}
        <div className="mb-4 space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
            >
              <span className="text-sm">
                <span className="font-bold text-arcadia-700">{cat.code}.</span> {cat.name}{" "}
                <span className="text-gray-400 text-xs">(order: {cat.sortOrder})</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(cat)}
                  className="text-xs text-arcadia-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(cat.id!, cat.name)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No categories yet</p>
          )}
        </div>

        {/* Add / Edit form */}
        <form onSubmit={handleSubmit} className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {editId ? "Edit Category" : "Add New Category"}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="A"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Suppliers"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              min={1}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editId ? "Update" : "Add Category"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ENTRY MODAL (Add / Edit)
   ═══════════════════════════════════════════ */

function EntryModal({
  projectName,
  categoryId,
  entry,
  nextSerial,
  onClose,
  onSaved,
}: {
  projectName: string;
  categoryId: number;
  entry: AccountEntryDto | null;
  nextSerial: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: entry?.name ?? "",
    itemWork: entry?.itemWork ?? "",
    serialNumber: entry?.serialNumber ?? nextSerial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Vendor name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const dto: AccountEntryDto = {
        ...(entry || {}),
        projectName,
        categoryId,
        serialNumber: form.serialNumber,
        name: form.name.trim(),
        itemWork: form.itemWork.trim() || undefined,
        totalInvoiced: entry?.totalInvoiced ?? 0,
        totalPaid: entry?.totalPaid ?? 0,
        balancePayable: entry?.balancePayable ?? 0,
        invoices: entry?.invoices ?? [],
        payments: entry?.payments ?? [],
      };
      if (entry?.id) {
        await accountService.updateEntry(entry.id, dto);
      } else {
        await accountService.createEntry(dto);
      }
      onSaved();
    } catch {
      setError("Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {entry ? "Edit Entry" : "Add Entry"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              S.No
            </label>
            <input
              type="number"
              value={form.serialNumber}
              onChange={(e) => setForm((f) => ({ ...f, serialNumber: Number(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="e.g., RK Traders"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item/Work
            </label>
            <input
              type="text"
              value={form.itemWork}
              onChange={(e) => setForm((f) => ({ ...f, itemWork: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="e.g., RMC, Steel, Plumbing"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : entry ? "Update" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   INVOICE MODAL
   ═══════════════════════════════════════════ */

function InvoiceModal({
  entryId,
  invoice,
  onClose,
  onSaved,
}: {
  entryId: number;
  invoice: AccountInvoiceDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    invoiceDate: invoice?.invoiceDate ?? toISODate(new Date()),
    amount: invoice?.amount ?? 0,
    description: invoice?.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const dto: AccountInvoiceDto = {
        entryId,
        invoiceDate: form.invoiceDate,
        amount: form.amount,
        description: form.description.trim() || undefined,
      };
      if (invoice?.id) {
        await accountService.updateInvoice(invoice.id, dto);
      } else {
        await accountService.addInvoice(entryId, dto);
      }
      onSaved();
    } catch {
      setError("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {invoice ? "Edit Invoice" : "Add Invoice"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.invoiceDate}
              onChange={(e) => setForm((f) => ({ ...f, invoiceDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Rs) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.amount || ""}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Enter amount"
              min={1}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Invoice description (optional)"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : invoice ? "Update" : "Add Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAYMENT MODAL
   ═══════════════════════════════════════════ */

function PaymentModal({
  entryId,
  payment,
  onClose,
  onSaved,
}: {
  entryId: number;
  payment: AccountPaymentDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    paymentDate: payment?.paymentDate ?? toISODate(new Date()),
    amount: payment?.amount ?? 0,
    description: payment?.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const dto: AccountPaymentDto = {
        entryId,
        paymentDate: form.paymentDate,
        amount: form.amount,
        description: form.description.trim() || undefined,
      };
      if (payment?.id) {
        await accountService.updatePayment(payment.id, dto);
      } else {
        await accountService.addPayment(entryId, dto);
      }
      onSaved();
    } catch {
      setError("Failed to save payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {payment ? "Edit Payment" : "Add Payment"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Rs) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.amount || ""}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Enter amount"
              min={1}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Payment description (optional)"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : payment ? "Update" : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUMMARIES TAB
   ═══════════════════════════════════════════ */

function SummariesTab({ projectName }: { projectName: string }) {
  const [period, setPeriod] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("MONTHLY");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return toISODate(d);
  });
  const [toDate, setToDate] = useState(() => toISODate(new Date()));
  const [summaries, setSummaries] = useState<AccountSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function fetchSummary() {
    setLoading(true);
    setError("");
    accountService
      .getSummary(projectName, period, fromDate, toDate)
      .then(setSummaries)
      .catch(() => setError("Failed to load summary"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchSummary();
  }, [projectName]);

  // Collect all unique category keys from breakdown
  const categoryKeys = Array.from(
    new Set(summaries.flatMap((s) => Object.keys(s.categoryBreakdown || {})))
  );

  const grandTotals = {
    invoiced: summaries.reduce((s, r) => s + r.totalInvoiced, 0),
    paid: summaries.reduce((s, r) => s + r.totalPaid, 0),
    balance: summaries.reduce((s, r) => s + r.balancePayable, 0),
    categories: categoryKeys.reduce((acc, key) => {
      acc[key] = summaries.reduce((s, r) => s + (r.categoryBreakdown?.[key] ?? 0), 0);
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
            <div className="flex gap-1">
              {(["WEEKLY", "BIWEEKLY", "MONTHLY"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${
                    period === p
                      ? "bg-arcadia-600 text-white border-arcadia-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p === "WEEKLY" ? "Weekly" : p === "BIWEEKLY" ? "Bi-Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="px-4 py-1.5 bg-arcadia-600 text-white text-sm rounded-lg hover:bg-arcadia-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Table */}
      {summaries.length === 0 ? (
        <p className="text-gray-400 text-center py-12">
          {loading ? "Loading..." : "No summary data. Click Search to load."}
        </p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Period</th>
                <th className="px-3 py-2 text-right">Total Invoiced</th>
                <th className="px-3 py-2 text-right">Total Paid</th>
                <th className="px-3 py-2 text-right">Balance</th>
                {categoryKeys.map((key) => (
                  <th key={key} className="px-3 py-2 text-right">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaries.map((s, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{s.periodLabel}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(s.totalInvoiced)}</td>
                  <td className="px-3 py-2 text-right text-green-700">
                    {formatCurrency(s.totalPaid)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      s.balancePayable > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(s.balancePayable)}
                  </td>
                  {categoryKeys.map((key) => (
                    <td key={key} className="px-3 py-2 text-right text-gray-600">
                      {formatCurrency(s.categoryBreakdown?.[key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-3 py-2">Totals</td>
                <td className="px-3 py-2 text-right">{formatCurrency(grandTotals.invoiced)}</td>
                <td className="px-3 py-2 text-right text-green-700">
                  {formatCurrency(grandTotals.paid)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    grandTotals.balance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(grandTotals.balance)}
                </td>
                {categoryKeys.map((key) => (
                  <td key={key} className="px-3 py-2 text-right text-gray-600">
                    {formatCurrency(grandTotals.categories[key] ?? 0)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ANALYTICS TAB
   ═══════════════════════════════════════════ */

function AnalyticsTab({ projectName }: { projectName: string }) {
  const [categoryTotals, setCategoryTotals] = useState<Record<string, CategoryTotalDto>>({});
  const [vendorTotals, setVendorTotals] = useState<VendorTotalDto[]>([]);
  const [entries, setEntries] = useState<AccountEntryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      accountService.getCategoryTotals(projectName),
      accountService.getVendorTotals(projectName),
      accountService.getLedger(projectName),
    ])
      .then(([catTotalsRaw, vendTotalsRaw, ledger]) => {
        // Transform category totals: API returns array of {categoryName, totalInvoiced, totalPaid, balancePayable}
        // We need Record<string, CategoryTotalDto> keyed by category name
        const catMap: Record<string, CategoryTotalDto> = {};
        if (Array.isArray(catTotalsRaw)) {
          for (const ct of catTotalsRaw as any[]) {
            const name = ct.categoryName || ct.name || "Unknown";
            catMap[name] = {
              invoiced: ct.totalInvoiced ?? ct.invoiced ?? 0,
              paid: ct.totalPaid ?? ct.paid ?? 0,
              balance: ct.balancePayable ?? ct.balance ?? 0,
            };
          }
        } else {
          // Already in expected shape
          Object.assign(catMap, catTotalsRaw);
        }
        setCategoryTotals(catMap);

        // Transform vendor totals: API returns {vendorName} but we need {name}
        const vendors: VendorTotalDto[] = (vendTotalsRaw as any[]).map((v: any) => ({
          name: v.vendorName ?? v.name ?? "",
          categoryCode: v.categoryCode ?? "",
          categoryName: v.categoryName ?? "",
          itemWork: v.itemWork ?? "",
          totalInvoiced: v.totalInvoiced ?? 0,
          totalPaid: v.totalPaid ?? 0,
          balancePayable: v.balancePayable ?? 0,
        }));
        setVendorTotals(vendors);

        setEntries(ledger);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectName]);

  if (loading) {
    return <p className="text-gray-400 text-center py-12">Loading analytics...</p>;
  }

  // --- Pie chart data: Category-wise share of total invoiced ---
  const pieData = Object.entries(categoryTotals).map(([name, totals]) => ({
    name,
    value: totals.invoiced,
  }));

  // --- Monthly trend: invoiced vs paid per month ---
  const monthlyMap: Record<string, { month: string; invoiced: number; paid: number }> = {};
  for (const entry of entries) {
    if (entry.invoices) {
      for (const inv of entry.invoices) {
        if (inv.invoiceDate) {
          const m = inv.invoiceDate.slice(0, 7); // YYYY-MM
          if (!monthlyMap[m]) monthlyMap[m] = { month: m, invoiced: 0, paid: 0 };
          monthlyMap[m].invoiced += inv.amount;
        }
      }
    }
    if (entry.payments) {
      for (const pay of entry.payments) {
        if (pay.paymentDate) {
          const m = pay.paymentDate.slice(0, 7);
          if (!monthlyMap[m]) monthlyMap[m] = { month: m, invoiced: 0, paid: 0 };
          monthlyMap[m].paid += pay.amount;
        }
      }
    }
  }
  const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  // --- Top 10 vendors by invoice amount ---
  const top10Vendors = [...vendorTotals]
    .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
    .slice(0, 10)
    .map((v) => ({
      name: v.name.length > 20 ? v.name.slice(0, 18) + "..." : v.name,
      fullName: v.name,
      invoiced: v.totalInvoiced,
    }));

  // --- Balance payable by category (stacked bar) ---
  const balanceByCategory = Object.entries(categoryTotals).map(([name, totals]) => ({
    name,
    paid: totals.paid,
    balance: totals.balance,
  }));

  const hasData = pieData.length > 0 || monthlyTrend.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg font-medium">No data available for analytics</p>
        <p className="text-sm mt-2">Add entries in the Ledger tab to see analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Category-wise share */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Category-wise Invoice Share
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart: Monthly trend */}
        {monthlyTrend.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Monthly Spending Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatCurrency(v)}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="invoiced" fill="#3b82f6" name="Invoiced" />
                <Bar dataKey="paid" fill="#10b981" name="Paid" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Horizontal Bar: Top 10 vendors */}
        {top10Vendors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Top 10 Vendors by Invoice Amount
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10Vendors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatCurrency(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  width={120}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string) => {
                    const vendor = top10Vendors.find((v: { name: string; fullName: string; invoiced: number }) => v.name === label);
                    return vendor?.fullName ?? label;
                  }}
                />
                <Bar dataKey="invoiced" fill="#f59e0b" name="Invoiced" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stacked Bar: Balance payable by category */}
        {balanceByCategory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Balance Payable by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={balanceByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatCurrency(v)}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
                <Bar dataKey="balance" stackId="a" fill="#ef4444" name="Balance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
