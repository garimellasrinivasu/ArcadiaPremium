import { useEffect, useState } from "react";
import { saleService } from "../services/saleService";
import type { SaleEntry, CreateSaleEntryRequest } from "../types/user";

const PROJECTS = ["Praneeth Arcadia Premium", "Redfern Square"];
const SPG_OPTIONS = ["SPG", "Praneeth"];
const TYPE_OPTIONS = ["OTP", "R"];
const PERSONAL_COMPANY = ["Personal", "Company"];
const FACING_OPTIONS = ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"];
const LAND_EXTENT_OPTIONS = [167, 180, 200, 225, 250, 300, 350];
const DEFAULT_SBUA_MULTIPLIER = 14;

// Default charge values (matching backend)
const DEF_CLUB_HOUSE = 1000000;
const DEF_CORPUS_FUND = 100000;
const DEF_LEGAL_DOC = 25000;
const DEF_CAUTION_DEPOSIT = 50000;
const DEF_MAINT_RATE = 3.5;
const DEF_MAINT_MONTHS = 24;

const emptyForm: CreateSaleEntryRequest = {
  bookingDate: new Date().toISOString().split("T")[0],
  project: "",
  spgPraneeth: "",
  tokenNumber: "",
  customerName: "",
  personalCompany: "",
  sol: "",
  typeOfSale: "OTP",
  landExtentSqYards: undefined,
  sbuaSft: undefined,
  facing: "",
  basePricePerSft: undefined,
  amenitiesPremiums: "",
  receivedAmount: undefined,
  includeClubHouse: false,
  clubHouseCharges: DEF_CLUB_HOUSE,
  includeCorpusFund: false,
  corpusFund: DEF_CORPUS_FUND,
  includeLegalDoc: false,
  legalDocCharges: DEF_LEGAL_DOC,
  includeCautionDeposit: false,
  refundableCautionDeposit: DEF_CAUTION_DEPOSIT,
  includeAdvanceMaintenance: false,
  advanceMaintRatePerSft: DEF_MAINT_RATE,
  advanceMaintMonths: DEF_MAINT_MONTHS,
  remarks: "",
};

function formatCurrency(val?: number) {
  if (val == null) return "—";
  return "₹ " + val.toLocaleString("en-IN");
}

export default function SaleEntryPage() {
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateSaleEntryRequest>({ ...emptyForm });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [paymentModal, setPaymentModal] = useState<SaleEntry | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewEntry, setViewEntry] = useState<SaleEntry | null>(null);
  const [sbuaMultiplier, setSbuaMultiplier] = useState(DEFAULT_SBUA_MULTIPLIER);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    try { setEntries(await saleService.getAll()); }
    catch { setError("Failed to load sale entries"); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) { loadEntries(); return; }
    setLoading(true);
    try { setEntries(await saleService.search(searchTerm)); }
    catch { setError("Search failed"); }
    finally { setLoading(false); }
  };

  // --- Computed totals for the form ---
  const saleAmount = (form.sbuaSft || 0) * (form.basePricePerSft || 0);

  const advMaintTotal = form.includeAdvanceMaintenance
    ? (form.advanceMaintRatePerSft || DEF_MAINT_RATE) * (form.sbuaSft || 0) * (form.advanceMaintMonths || DEF_MAINT_MONTHS)
    : 0;

  const additionalChargesTotal =
    (form.includeClubHouse ? (form.clubHouseCharges || DEF_CLUB_HOUSE) : 0) +
    (form.includeCorpusFund ? (form.corpusFund || DEF_CORPUS_FUND) : 0) +
    (form.includeLegalDoc ? (form.legalDocCharges || DEF_LEGAL_DOC) : 0) +
    (form.includeCautionDeposit ? (form.refundableCautionDeposit || DEF_CAUTION_DEPOSIT) : 0) +
    advMaintTotal;

  const grandTotal = saleAmount + additionalChargesTotal;
  const computedBalance = grandTotal - (form.receivedAmount || 0);

  const handleFieldChange = (field: keyof CreateSaleEntryRequest, value: string | number | boolean | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.customerName.trim()) { setError("Customer Name is required"); return; }
    if (!form.project) { setError("Project is required"); return; }
    setSaving(true);
    try {
      if (editId) {
        await saleService.update(editId, form);
        setSuccess("Sale entry updated successfully");
      } else {
        await saleService.create(form);
        setSuccess("Sale entry created successfully");
      }
      setForm({ ...emptyForm }); setShowForm(false); setEditId(null);
      loadEntries();
    } catch { setError("Failed to save sale entry"); }
    finally { setSaving(false); }
  };

  const handleEdit = (entry: SaleEntry) => {
    setForm({
      bookingDate: entry.bookingDate,
      project: entry.project,
      spgPraneeth: entry.spgPraneeth || "",
      tokenNumber: entry.tokenNumber || "",
      customerName: entry.customerName,
      personalCompany: entry.personalCompany || "",
      sol: entry.sol || "",
      typeOfSale: entry.typeOfSale || "OTP",
      landExtentSqYards: entry.landExtentSqYards,
      sbuaSft: entry.sbuaSft,
      facing: entry.facing || "",
      basePricePerSft: entry.basePricePerSft,
      amenitiesPremiums: entry.amenitiesPremiums || "",
      receivedAmount: entry.receivedAmount,
      includeClubHouse: entry.includeClubHouse || false,
      clubHouseCharges: entry.clubHouseCharges || DEF_CLUB_HOUSE,
      includeCorpusFund: entry.includeCorpusFund || false,
      corpusFund: entry.corpusFund || DEF_CORPUS_FUND,
      includeLegalDoc: entry.includeLegalDoc || false,
      legalDocCharges: entry.legalDocCharges || DEF_LEGAL_DOC,
      includeCautionDeposit: entry.includeCautionDeposit || false,
      refundableCautionDeposit: entry.refundableCautionDeposit || DEF_CAUTION_DEPOSIT,
      includeAdvanceMaintenance: entry.includeAdvanceMaintenance || false,
      advanceMaintRatePerSft: entry.advanceMaintRatePerSft || DEF_MAINT_RATE,
      advanceMaintMonths: entry.advanceMaintMonths || DEF_MAINT_MONTHS,
      remarks: entry.remarks || "",
    });
    setEditId(entry.id); setShowForm(true); setError(""); setSuccess("");
    // Derive multiplier from existing data if possible
    if (entry.landExtentSqYards && entry.sbuaSft && entry.landExtentSqYards > 0) {
      setSbuaMultiplier(Math.round((entry.sbuaSft / entry.landExtentSqYards) * 100) / 100);
    } else {
      setSbuaMultiplier(DEFAULT_SBUA_MULTIPLIER);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentModal) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt < 0) { setError("Enter a valid amount"); return; }
    setPaymentSaving(true);
    try {
      await saleService.updatePayment(paymentModal.id, { receivedAmount: amt, remarks: paymentRemarks || undefined });
      setSuccess("Payment updated successfully for " + paymentModal.customerName);
      setPaymentModal(null); setPaymentAmount(""); setPaymentRemarks("");
      loadEntries();
    } catch { setError("Failed to update payment"); }
    finally { setPaymentSaving(false); }
  };

  const openPaymentModal = (entry: SaleEntry) => {
    setPaymentModal(entry); setPaymentAmount(entry.receivedAmount?.toString() || "0");
    setPaymentRemarks(entry.remarks || ""); setError("");
  };

  const handleNewEntry = () => {
    setForm({ ...emptyForm }); setEditId(null); setShowForm(true); setError(""); setSuccess("");
    setSbuaMultiplier(DEFAULT_SBUA_MULTIPLIER);
  };

  // Stats
  const totalSales = entries.length;
  const totalConsideration = entries.reduce((s, e) => s + (e.grandTotal || e.totalSalesConsideration || 0), 0);
  const totalReceived = entries.reduce((s, e) => s + (e.receivedAmount || 0), 0);
  const totalBalance = entries.reduce((s, e) => s + (e.balanceToReceive || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-800">Sale Entry</h2>
        <button onClick={handleNewEntry}
          className="px-4 py-2 text-sm font-medium text-white bg-arcadia-600 rounded-lg hover:bg-arcadia-700 transition">
          + New Sale Entry
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}<button onClick={() => setError("")} className="ml-2 font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}<button onClick={() => setSuccess("")} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Sales</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalSales}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Grand Total</p>
          <p className="text-2xl font-bold text-arcadia-700 mt-1">{formatCurrency(totalConsideration)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Received</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Balance</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <input type="text" placeholder="Search by customer name..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none" />
        <button onClick={handleSearch} className="px-4 py-2 text-sm bg-gray-100 border rounded-lg hover:bg-gray-200">Search</button>
        {searchTerm && <button onClick={() => { setSearchTerm(""); loadEntries(); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Clear</button>}
      </div>

      {/* ===== SALE ENTRY FORM ===== */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{editId ? "Edit Sale Entry" : "New Sale Entry"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Date, Project, SPG */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Booking Date *</label>
                <input type="date" value={form.bookingDate} onChange={(e) => handleFieldChange("bookingDate", e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project *</label>
                <select value={form.project} onChange={(e) => handleFieldChange("project", e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white">
                  <option value="">-- Select Project --</option>
                  {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SPG / Praneeth</label>
                <select value={form.spgPraneeth || ""} onChange={(e) => handleFieldChange("spgPraneeth", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white">
                  <option value="">-- Select --</option>
                  {SPG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Token, Customer, Personal/Company */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Token #</label>
                <input type="text" value={form.tokenNumber || ""} onChange={(e) => handleFieldChange("tokenNumber", e.target.value)}
                  placeholder="e.g. RS001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                <input type="text" value={form.customerName} onChange={(e) => handleFieldChange("customerName", e.target.value)} required
                  placeholder="Full name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Personal / Company</label>
                <select value={form.personalCompany || ""} onChange={(e) => handleFieldChange("personalCompany", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white">
                  <option value="">-- Select --</option>
                  {PERSONAL_COMPANY.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: SOL, Type, Facing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SOL (Source of Lead)</label>
                <input type="text" value={form.sol || ""} onChange={(e) => handleFieldChange("sol", e.target.value)}
                  placeholder="e.g. Referral name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type of Sale</label>
                <div className="flex gap-2 mt-1">
                  {TYPE_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => handleFieldChange("typeOfSale", opt)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${form.typeOfSale === opt ? "bg-arcadia-600 text-white border-arcadia-600" : "bg-white text-gray-600 border-gray-300 hover:border-arcadia-400"}`}>
                      {opt === "OTP" ? "OTP" : "Resale"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Facing</label>
                <select value={form.facing || ""} onChange={(e) => handleFieldChange("facing", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white">
                  <option value="">-- Select --</option>
                  {FACING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4: Land, SBUA, Base Price */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Land Extent (Sq.yards)</label>
                <div className="flex gap-2">
                  <select
                    value={LAND_EXTENT_OPTIONS.includes(form.landExtentSqYards as number) ? form.landExtentSqYards : "custom"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") return;
                      const numVal = parseFloat(val);
                      setForm((prev) => ({
                        ...prev,
                        landExtentSqYards: numVal,
                        sbuaSft: numVal * sbuaMultiplier,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none bg-white"
                  >
                    <option value="">-- Select --</option>
                    {LAND_EXTENT_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v} sq.yds</option>
                    ))}
                    {form.landExtentSqYards && !LAND_EXTENT_OPTIONS.includes(form.landExtentSqYards) && (
                      <option value="custom">{form.landExtentSqYards} sq.yds (custom)</option>
                    )}
                  </select>
                  <input type="number" step="0.01" value={form.landExtentSqYards ?? ""}
                    onChange={(e) => {
                      const numVal = e.target.value ? parseFloat(e.target.value) : undefined;
                      setForm((prev) => ({
                        ...prev,
                        landExtentSqYards: numVal,
                        sbuaSft: numVal ? numVal * sbuaMultiplier : prev.sbuaSft,
                      }));
                    }}
                    placeholder="Custom"
                    className="w-28 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Multiplier</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Land &times;</span>
                  <input type="number" step="0.1" value={sbuaMultiplier}
                    onChange={(e) => {
                      const newMult = e.target.value ? parseFloat(e.target.value) : DEFAULT_SBUA_MULTIPLIER;
                      setSbuaMultiplier(newMult);
                      if (form.landExtentSqYards) {
                        setForm((prev) => ({ ...prev, sbuaSft: (prev.landExtentSqYards || 0) * newMult }));
                      }
                    }}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-arcadia-500 outline-none" />
                  <span className="text-sm text-gray-500">= SBUA</span>
                </div>
              </div>
            </div>

            {/* SBUA (sft) - auto-calculated but editable */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  SBUA (sft) <span className="text-gray-400 font-normal">= {form.landExtentSqYards || 0} &times; {sbuaMultiplier}</span>
                </label>
                <input type="number" step="0.01" value={form.sbuaSft ?? ""} onChange={(e) => handleFieldChange("sbuaSft", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
                {form.landExtentSqYards && form.sbuaSft && form.sbuaSft !== form.landExtentSqYards * sbuaMultiplier && (
                  <p className="mt-1 text-xs text-amber-600">Manually adjusted from auto-calculated {(form.landExtentSqYards * sbuaMultiplier).toLocaleString("en-IN")} sft</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Base Price per Sft (₹)</label>
                <input type="number" step="0.01" value={form.basePricePerSft ?? ""} onChange={(e) => handleFieldChange("basePricePerSft", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
            </div>

            {/* Sale Amount display */}
            {(form.sbuaSft && form.basePricePerSft) ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-xs text-blue-600 font-medium">Villa Sale Amount (SBUA &times; Base Price):</span>
                <span className="ml-2 text-lg font-bold text-blue-800">{formatCurrency(saleAmount)}</span>
              </div>
            ) : null}

            {/* Amenities text + Received */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amenities & Other Premiums (notes)</label>
                <input type="text" value={form.amenitiesPremiums || ""} onChange={(e) => handleFieldChange("amenitiesPremiums", e.target.value)}
                  placeholder="e.g. Facing/Corner Charges are extra" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Received (₹)</label>
                <input type="number" step="0.01" value={form.receivedAmount ?? ""} onChange={(e) => handleFieldChange("receivedAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
              </div>
            </div>

            {/* ===== ADDITIONAL CHARGES SECTION ===== */}
            <div className="border border-orange-200 rounded-xl bg-orange-50/50 p-4">
              <h4 className="text-sm font-bold text-orange-800 mb-3">Additional Charges (select applicable)</h4>

              <div className="space-y-3">
                {/* 1. Club House / Amenities */}
                <ChargeToggle
                  label="Club House / Amenities Charges"
                  checked={!!form.includeClubHouse}
                  onToggle={(v) => handleFieldChange("includeClubHouse", v)}
                  amount={form.clubHouseCharges ?? DEF_CLUB_HOUSE}
                  onAmountChange={(v) => handleFieldChange("clubHouseCharges", v)}
                  defaultAmount={DEF_CLUB_HOUSE}
                />

                {/* 2. Corpus Fund */}
                <ChargeToggle
                  label="Corpus Fund (one-time, non-refundable)"
                  checked={!!form.includeCorpusFund}
                  onToggle={(v) => handleFieldChange("includeCorpusFund", v)}
                  amount={form.corpusFund ?? DEF_CORPUS_FUND}
                  onAmountChange={(v) => handleFieldChange("corpusFund", v)}
                  defaultAmount={DEF_CORPUS_FUND}
                />

                {/* 3. Legal & Doc */}
                <ChargeToggle
                  label="Legal & Documentation Charges"
                  checked={!!form.includeLegalDoc}
                  onToggle={(v) => handleFieldChange("includeLegalDoc", v)}
                  amount={form.legalDocCharges ?? DEF_LEGAL_DOC}
                  onAmountChange={(v) => handleFieldChange("legalDocCharges", v)}
                  defaultAmount={DEF_LEGAL_DOC}
                />

                {/* 4. Refundable Caution Deposit */}
                <ChargeToggle
                  label="Refundable Caution Deposit (after due adjustments)"
                  checked={!!form.includeCautionDeposit}
                  onToggle={(v) => handleFieldChange("includeCautionDeposit", v)}
                  amount={form.refundableCautionDeposit ?? DEF_CAUTION_DEPOSIT}
                  onAmountChange={(v) => handleFieldChange("refundableCautionDeposit", v)}
                  defaultAmount={DEF_CAUTION_DEPOSIT}
                />

                {/* 5. Advance Maintenance — special: rate × SBUA × months */}
                <div className={`rounded-lg border p-3 transition ${form.includeAdvanceMaintenance ? "border-orange-300 bg-white" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!form.includeAdvanceMaintenance}
                        onChange={(e) => handleFieldChange("includeAdvanceMaintenance", e.target.checked)}
                        className="w-4 h-4 rounded text-arcadia-600 focus:ring-arcadia-500" />
                      <span className="text-sm font-medium text-gray-700">Advance Maintenance</span>
                    </label>
                  </div>
                  {form.includeAdvanceMaintenance && (
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">₹</span>
                        <input type="number" step="0.1" value={form.advanceMaintRatePerSft ?? DEF_MAINT_RATE}
                          onChange={(e) => handleFieldChange("advanceMaintRatePerSft", e.target.value ? parseFloat(e.target.value) : DEF_MAINT_RATE)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-arcadia-500 outline-none" />
                        <span className="text-gray-500">/sft</span>
                      </div>
                      <span className="text-gray-400">&times;</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">SBUA</span>
                        <span className="font-medium text-gray-700">{form.sbuaSft?.toLocaleString("en-IN") || "0"}</span>
                      </div>
                      <span className="text-gray-400">&times;</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={form.advanceMaintMonths ?? DEF_MAINT_MONTHS}
                          onChange={(e) => handleFieldChange("advanceMaintMonths", e.target.value ? parseInt(e.target.value) : DEF_MAINT_MONTHS)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-arcadia-500 outline-none" />
                        <span className="text-gray-500">months</span>
                      </div>
                      <span className="text-gray-400">=</span>
                      <span className="font-bold text-orange-700">{formatCurrency(advMaintTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional charges total */}
              {additionalChargesTotal > 0 && (
                <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between items-center">
                  <span className="text-sm font-semibold text-orange-800">Total Additional Charges:</span>
                  <span className="text-lg font-bold text-orange-700">{formatCurrency(additionalChargesTotal)}</span>
                </div>
              )}
            </div>

            {/* ===== GRAND TOTAL SUMMARY ===== */}
            {(form.sbuaSft && form.basePricePerSft) ? (
              <div className="bg-gradient-to-r from-arcadia-50 to-blue-50 border border-arcadia-200 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Villa Sale Amount</p>
                    <p className="text-lg font-bold text-blue-800">{formatCurrency(saleAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Grand Total (incl. charges)</p>
                    <p className="text-xl font-bold text-arcadia-800">{formatCurrency(grandTotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Balance To Receive</p>
                    <p className={`text-lg font-bold ${computedBalance > 0 ? "text-red-600" : "text-green-700"}`}>{formatCurrency(computedBalance)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Remarks */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
              <textarea value={form.remarks || ""} onChange={(e) => handleFieldChange("remarks", e.target.value)} rows={2}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none resize-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-arcadia-600 rounded-lg hover:bg-arcadia-700 transition disabled:opacity-50">
                {saving ? "Saving..." : editId ? "Update Entry" : "Create Entry"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ===== SALES TABLE ===== */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Token#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Sale Amount</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Add. Charges</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Grand Total</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Received</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Balance</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-10 text-gray-400">No sale entries found. Click "+ New Sale Entry" to add one.</td></tr>
              ) : entries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-3 py-3 text-gray-700">{entry.serialNo}</td>
                  <td className="px-3 py-3 text-gray-700">{entry.bookingDate}</td>
                  <td className="px-3 py-3 text-gray-700 font-medium">{entry.project}</td>
                  <td className="px-3 py-3 text-gray-500">{entry.tokenNumber || "\u2014"}</td>
                  <td className="px-3 py-3 text-gray-800 font-medium">{entry.customerName}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${entry.typeOfSale === "OTP" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {entry.typeOfSale || "\u2014"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-blue-700 text-right">{formatCurrency(entry.totalSalesConsideration)}</td>
                  <td className="px-3 py-3 text-orange-600 text-right">{formatCurrency(entry.totalAdditionalCharges)}</td>
                  <td className="px-3 py-3 text-arcadia-700 font-semibold text-right">{formatCurrency(entry.grandTotal)}</td>
                  <td className="px-3 py-3 text-green-700 font-semibold text-right">{formatCurrency(entry.receivedAmount)}</td>
                  <td className="px-3 py-3 text-red-600 font-semibold text-right">{formatCurrency(entry.balanceToReceive)}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setViewEntry(entry)} title="View Details"
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition">View</button>
                      <button onClick={() => openPaymentModal(entry)} title="Update Payment"
                        className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition">Payment</button>
                      <button onClick={() => handleEdit(entry)} title="Edit"
                        className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== VIEW DETAIL MODAL ===== */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setViewEntry(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Sale Entry Details &mdash; #{viewEntry.serialNo}</h3>
              <button onClick={() => setViewEntry(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail label="Booking Date" value={viewEntry.bookingDate} />
              <Detail label="Project" value={viewEntry.project} />
              <Detail label="SPG / Praneeth" value={viewEntry.spgPraneeth} />
              <Detail label="Token #" value={viewEntry.tokenNumber} />
              <Detail label="Customer Name" value={viewEntry.customerName} />
              <Detail label="Personal / Company" value={viewEntry.personalCompany} />
              <Detail label="SOL" value={viewEntry.sol} />
              <Detail label="Type of Sale" value={viewEntry.typeOfSale} />
              <Detail label="Land Extent (Sq.yards)" value={viewEntry.landExtentSqYards?.toString()} />
              <Detail label="SBUA (sft)" value={viewEntry.sbuaSft?.toLocaleString("en-IN")} />
              <Detail label="Facing" value={viewEntry.facing} />
              <Detail label="Base Price per Sft" value={formatCurrency(viewEntry.basePricePerSft)} />
              <Detail label="Amenities & Premiums" value={viewEntry.amenitiesPremiums} />
              <Detail label="Villa Sale Amount" value={formatCurrency(viewEntry.totalSalesConsideration)} highlight="blue" />
            </div>

            {/* Additional Charges breakdown */}
            {(viewEntry.totalAdditionalCharges && viewEntry.totalAdditionalCharges > 0) ? (
              <div className="mt-4 border border-orange-200 rounded-lg bg-orange-50/50 p-3">
                <h4 className="text-xs font-bold text-orange-800 mb-2 uppercase">Additional Charges</h4>
                <div className="space-y-1 text-sm">
                  {viewEntry.includeClubHouse && (
                    <div className="flex justify-between"><span className="text-gray-600">Club House / Amenities Charges</span><span className="font-medium">{formatCurrency(viewEntry.clubHouseCharges)}</span></div>
                  )}
                  {viewEntry.includeCorpusFund && (
                    <div className="flex justify-between"><span className="text-gray-600">Corpus Fund</span><span className="font-medium">{formatCurrency(viewEntry.corpusFund)}</span></div>
                  )}
                  {viewEntry.includeLegalDoc && (
                    <div className="flex justify-between"><span className="text-gray-600">Legal & Documentation</span><span className="font-medium">{formatCurrency(viewEntry.legalDocCharges)}</span></div>
                  )}
                  {viewEntry.includeCautionDeposit && (
                    <div className="flex justify-between"><span className="text-gray-600">Refundable Caution Deposit</span><span className="font-medium">{formatCurrency(viewEntry.refundableCautionDeposit)}</span></div>
                  )}
                  {viewEntry.includeAdvanceMaintenance && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance Maintenance (₹{viewEntry.advanceMaintRatePerSft}/sft &times; {viewEntry.sbuaSft} sft &times; {viewEntry.advanceMaintMonths} months)</span>
                      <span className="font-medium">{formatCurrency(viewEntry.advanceMaintenanceTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-orange-200 font-bold text-orange-800">
                    <span>Total Additional Charges</span><span>{formatCurrency(viewEntry.totalAdditionalCharges)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Financial summary */}
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail label="Grand Total" value={formatCurrency(viewEntry.grandTotal)} highlight="blue" />
              <Detail label="Amount Received" value={formatCurrency(viewEntry.receivedAmount)} highlight="green" />
              <Detail label="Balance To Receive" value={formatCurrency(viewEntry.balanceToReceive)} highlight="red" />
              <Detail label="Balance (Plan Approved)" value={formatCurrency(viewEntry.balancePlanApproved)} />
              <Detail label="Balance (During Execution)" value={formatCurrency(viewEntry.balanceDuringExecution)} />
              {viewEntry.remarks && <div className="col-span-2"><Detail label="Remarks" value={viewEntry.remarks} /></div>}
            </div>
          </div>
        </div>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPaymentModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Update Payment</h3>
            <p className="text-sm text-gray-500 mb-4">{paymentModal.customerName} &mdash; {paymentModal.project}</p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Grand Total:</span><span className="font-semibold">{formatCurrency(paymentModal.grandTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Current Received:</span><span className="font-semibold text-green-700">{formatCurrency(paymentModal.receivedAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Current Balance:</span><span className="font-semibold text-red-600">{formatCurrency(paymentModal.balanceToReceive)}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Total Received Amount (₹) *</label>
                <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none" />
                {paymentAmount && paymentModal.grandTotal && (
                  <p className="mt-1 text-xs text-gray-500">
                    New Balance: <span className="font-semibold text-red-600">{formatCurrency(paymentModal.grandTotal - parseFloat(paymentAmount || "0"))}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <textarea value={paymentRemarks} onChange={(e) => setPaymentRemarks(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 outline-none resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handlePaymentSubmit} disabled={paymentSaving}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                {paymentSaving ? "Updating..." : "Update Payment"}
              </button>
              <button onClick={() => setPaymentModal(null)}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable components ---

function ChargeToggle({ label, checked, onToggle, amount, onAmountChange, defaultAmount }: {
  label: string; checked: boolean; onToggle: (v: boolean) => void;
  amount: number; onAmountChange: (v: number) => void; defaultAmount: number;
}) {
  return (
    <div className={`rounded-lg border p-3 transition ${checked ? "border-orange-300 bg-white" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 rounded text-arcadia-600 focus:ring-arcadia-500" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </label>
        {checked && (
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">₹</span>
            <input type="number" step="1" value={amount} onChange={(e) => onAmountChange(e.target.value ? parseFloat(e.target.value) : defaultAmount)}
              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-arcadia-500 outline-none" />
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, highlight }: { label: string; value?: string; highlight?: "blue" | "green" | "red" }) {
  const colorClass = highlight === "blue" ? "text-arcadia-700 font-semibold"
    : highlight === "green" ? "text-green-700 font-semibold"
    : highlight === "red" ? "text-red-600 font-semibold"
    : "text-gray-800";
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-0.5 ${colorClass}`}>{value || "\u2014"}</p>
    </div>
  );
}
