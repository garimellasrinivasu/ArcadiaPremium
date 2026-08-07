import { useEffect, useState, useRef } from "react";
import { useDownloadEnabled } from "../components/ViewOnlyWrapper";
import { initialSalesService } from "../services/initialSalesService";
import type { InitialSaleDto, CreateInitialSaleRequest } from "../services/initialSalesService";
import { useProject, PROJECTS } from "../contexts/ProjectContext";

/* ═══════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════ */

const SALE_MODES = ["OTP", "General"];
const FACING_OPTIONS = ["West", "East", "North East", "Any Corner"];

const FACING_CHARGES_MAP: Record<string, number> = {
  "West": 0,
  "East": 1000000,
  "North East": 2000000,
  "Any Corner": 1500000,
};

const DEFAULT_CLUB_HOUSE_AMOUNT = 1000000;

const DEFAULT_SFT_PER_SQYARD = 13.5;
const DEFAULT_NEW_SFT_PER_SQYARD = 14.10;

const DEFAULT_CORPUS_FUND = 100000;
const DEFAULT_LEGAL_CHARGES = 25000;
const DEFAULT_CAUTION_DEPOSIT = 50000;
const DEFAULT_MAINTENANCE_RATE = 3.5;
const DEFAULT_MAINTENANCE_MONTHS = 24;
const DEFAULT_GST_PERCENT = 5;
const DEFAULT_STAMP_DUTY_PERCENT = 7.6;

function formatINR(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

/* ═══════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════ */

export default function InitialSalesPage() {
  const downloadEnabled = useDownloadEnabled();
  const { activeProject, setPageProject } = useProject();

  // ─── Data ───
  const [records, setRecords] = useState<InitialSaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const isLoadingEdit = useRef(false);

  // ─── Basic Info ───
  const [customerName, setCustomerName] = useState("");
  const [sqYardsVilla, setSqYardsVilla] = useState<number>(200);
  const [villaNumber, setVillaNumber] = useState("");
  const [saleMode, setSaleMode] = useState("General");
  const [projectName, setProjectName] = useState(activeProject.name);

  // ─── Old Values ───
  const [sftPerSqYard, setSftPerSqYard] = useState<number>(DEFAULT_SFT_PER_SQYARD);
  // ─── Sale Price Rows (multiple entries) ───
  const [salePriceRows, setSalePriceRows] = useState<{ sqYards: number; pricePerSft: number; newPricePerSft: number }[]>([
    { sqYards: 200, pricePerSft: 0, newPricePerSft: 0 },
  ]);
  const [defaultFacing, setDefaultFacing] = useState("West");
  const [facingCharges, setFacingCharges] = useState<number>(FACING_CHARGES_MAP["West"] || 0);
  const [extraLandSqYards, setExtraLandSqYards] = useState<number>(0);
  const [extraLandPricePerSqYard, setExtraLandPricePerSqYard] = useState<number>(0);
  const [paymentTillNow, setPaymentTillNow] = useState<number>(0);

  // ─── New Values ───
  const [newSftPerSqYard, setNewSftPerSqYard] = useState<number>(DEFAULT_NEW_SFT_PER_SQYARD);
  const [newDefaultFacing, setNewDefaultFacing] = useState("West");
  const [newFacingCharges, setNewFacingCharges] = useState<number>(FACING_CHARGES_MAP["West"] || 0);
  const [newExtraLandSqYards, setNewExtraLandSqYards] = useState<number>(0);
  const [newExtraLandPricePerSqYard, setNewExtraLandPricePerSqYard] = useState<number>(0);
  const [newPaymentTillNow, setNewPaymentTillNow] = useState<number>(0);

  // ─── Total SFT per Villa (editable for customization) ───
  const [totalSftPerVilla, setTotalSftPerVilla] = useState<number>(200 * DEFAULT_SFT_PER_SQYARD);
  const [newTotalSftPerVilla, setNewTotalSftPerVilla] = useState<number>(200 * DEFAULT_NEW_SFT_PER_SQYARD);

  // ─── Additional Charges ───
  const [clubHouseApplicable, setClubHouseApplicable] = useState(true);
  const [clubHouseAmount, setClubHouseAmount] = useState<number>(DEFAULT_CLUB_HOUSE_AMOUNT);
  const [corpusFundApplicable, setCorpusFundApplicable] = useState(true);
  const [corpusFundAmount, setCorpusFundAmount] = useState<number>(DEFAULT_CORPUS_FUND);
  const [legalChargesApplicable, setLegalChargesApplicable] = useState(true);
  const [legalChargesAmount, setLegalChargesAmount] = useState<number>(DEFAULT_LEGAL_CHARGES);
  const [cautionDepositApplicable, setCautionDepositApplicable] = useState(true);
  const [cautionDepositAmount, setCautionDepositAmount] = useState<number>(DEFAULT_CAUTION_DEPOSIT);
  const [advanceMaintenanceApplicable, setAdvanceMaintenanceApplicable] = useState(true);
  const [advanceMaintenanceRate, setAdvanceMaintenanceRate] = useState<number>(DEFAULT_MAINTENANCE_RATE);
  const [advanceMaintenanceMonths, setAdvanceMaintenanceMonths] = useState<number>(DEFAULT_MAINTENANCE_MONTHS);

  // ─── Registration ───
  const [gstPercentage, setGstPercentage] = useState<number>(DEFAULT_GST_PERCENT);
  const [stampDutyPercentage, setStampDutyPercentage] = useState<number>(DEFAULT_STAMP_DUTY_PERCENT);

  // ─── Auto-Calculated Values (Old) ───
  const totalSftPrice = salePriceRows.reduce((sum, r) => sum + r.sqYards * sftPerSqYard * r.pricePerSft, 0);
  const extraLandTotal = extraLandSqYards * extraLandPricePerSqYard;
  const basePriceAmount = totalSftPrice + extraLandTotal + facingCharges;
  const balanceInBasePrice = basePriceAmount - paymentTillNow;

  // ─── Auto-Calculated Values (New) ───
  const newTotalSftPrice = salePriceRows.reduce((sum, r) => sum + r.sqYards * newSftPerSqYard * r.newPricePerSft, 0);
  const newExtraLandTotal = newExtraLandSqYards * newExtraLandPricePerSqYard;
  const newBasePriceAmount = newTotalSftPrice + newExtraLandTotal + newFacingCharges;
  const newBalanceInBasePrice = newBasePriceAmount - newPaymentTillNow;

  // ─── Advance Maintenance ───
  const advanceMaintenanceAmount = advanceMaintenanceApplicable
    ? advanceMaintenanceRate * totalSftPerVilla * advanceMaintenanceMonths
    : 0;
  const newAdvanceMaintenanceAmount = advanceMaintenanceApplicable
    ? advanceMaintenanceRate * newTotalSftPerVilla * advanceMaintenanceMonths
    : 0;

  // ─── Registration Payment ───
  const registrationPaymentOld =
    (clubHouseApplicable ? clubHouseAmount : 0) +
    (corpusFundApplicable ? corpusFundAmount : 0) +
    (legalChargesApplicable ? legalChargesAmount : 0) +
    (cautionDepositApplicable ? cautionDepositAmount : 0) +
    (advanceMaintenanceApplicable ? advanceMaintenanceAmount : 0);

  const registrationPaymentNew =
    (clubHouseApplicable ? clubHouseAmount : 0) +
    (corpusFundApplicable ? corpusFundAmount : 0) +
    (legalChargesApplicable ? legalChargesAmount : 0) +
    (cautionDepositApplicable ? cautionDepositAmount : 0) +
    (advanceMaintenanceApplicable ? newAdvanceMaintenanceAmount : 0);

  // ─── GST & Stamp Duty ───
  const gstAmount = (gstPercentage / 100) * basePriceAmount;
  const newGstAmount = (gstPercentage / 100) * newBasePriceAmount;
  const stampDutyAmount = (stampDutyPercentage / 100) * basePriceAmount;
  const newStampDutyAmount = (stampDutyPercentage / 100) * newBasePriceAmount;

  // ─── Sale mode: OTP disables club house, General sets ₹10L ───
  useEffect(() => {
    if (isLoadingEdit.current) return;
    if (saleMode === "OTP") {
      setClubHouseApplicable(false);
      setClubHouseAmount(0);
    } else if (saleMode === "General") {
      setClubHouseApplicable(true);
      setClubHouseAmount(DEFAULT_CLUB_HOUSE_AMOUNT);
    }
  }, [saleMode]);

  // ─── Auto-populate facing charges based on facing selection ───
  useEffect(() => {
    if (isLoadingEdit.current) return;
    setFacingCharges(FACING_CHARGES_MAP[defaultFacing] ?? 0);
  }, [defaultFacing]);

  useEffect(() => {
    if (isLoadingEdit.current) return;
    setNewFacingCharges(FACING_CHARGES_MAP[newDefaultFacing] ?? 0);
  }, [newDefaultFacing]);

  // ─── Auto-calc Total SFT per Villa (user can override for customization) ───
  useEffect(() => {
    if (isLoadingEdit.current) return;
    const total = salePriceRows.reduce((sum, r) => sum + r.sqYards * sftPerSqYard, 0);
    setTotalSftPerVilla(total);
  }, [salePriceRows, sftPerSqYard]);

  useEffect(() => {
    if (isLoadingEdit.current) return;
    const total = salePriceRows.reduce((sum, r) => sum + r.sqYards * newSftPerSqYard, 0);
    setNewTotalSftPerVilla(total);
  }, [salePriceRows, newSftPerSqYard]);

  // ─── Sync Payment Till Now: old → new ───
  useEffect(() => {
    if (isLoadingEdit.current) return;
    setNewPaymentTillNow(paymentTillNow);
  }, [paymentTillNow]);

  // ─── Sync project name with active project ───
  useEffect(() => {
    setProjectName(activeProject.name);
  }, [activeProject]);

  // ─── Load Data ───
  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    try {
      setLoading(true);
      const data = await initialSalesService.getAll();
      setRecords(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  // ─── Reset Form ───
  function resetForm() {
    setCustomerName("");
    setSqYardsVilla(200);
    setVillaNumber("");
    setSaleMode("General");
    setSftPerSqYard(DEFAULT_SFT_PER_SQYARD);
    setSalePriceRows([{ sqYards: 200, pricePerSft: 0, newPricePerSft: 0 }]);
    setDefaultFacing("West");
    setFacingCharges(FACING_CHARGES_MAP["West"] || 0);
    setExtraLandSqYards(0);
    setExtraLandPricePerSqYard(0);
    setPaymentTillNow(0);
    setTotalSftPerVilla(200 * DEFAULT_SFT_PER_SQYARD);
    setNewSftPerSqYard(DEFAULT_NEW_SFT_PER_SQYARD);
    setNewDefaultFacing("West");
    setNewFacingCharges(FACING_CHARGES_MAP["West"] || 0);
    setNewExtraLandSqYards(0);
    setNewExtraLandPricePerSqYard(0);
    setNewPaymentTillNow(0);
    setNewTotalSftPerVilla(200 * DEFAULT_NEW_SFT_PER_SQYARD);
    setClubHouseApplicable(true);
    setClubHouseAmount(DEFAULT_CLUB_HOUSE_AMOUNT);
    setCorpusFundApplicable(true);
    setCorpusFundAmount(DEFAULT_CORPUS_FUND);
    setLegalChargesApplicable(true);
    setLegalChargesAmount(DEFAULT_LEGAL_CHARGES);
    setCautionDepositApplicable(true);
    setCautionDepositAmount(DEFAULT_CAUTION_DEPOSIT);
    setAdvanceMaintenanceApplicable(true);
    setAdvanceMaintenanceRate(DEFAULT_MAINTENANCE_RATE);
    setAdvanceMaintenanceMonths(DEFAULT_MAINTENANCE_MONTHS);
    setGstPercentage(DEFAULT_GST_PERCENT);
    setStampDutyPercentage(DEFAULT_STAMP_DUTY_PERCENT);
    setEditingId(null);
    setFormDisabled(false);
    setError("");
  }

  // ─── Submit ───
  async function handleSubmit() {
    if (!customerName.trim()) {
      setError("Customer Name is required");
      return;
    }
    if (!villaNumber.trim()) {
      setError("Villa Number is required");
      return;
    }

    const req: CreateInitialSaleRequest = {
      customerName: customerName.trim(),
      sqYardsVilla,
      villaNumber: villaNumber.trim(),
      saleMode,
      projectName,
      sftPerSqYard,
      salePricePerSft: salePriceRows[0]?.pricePerSft || 0,
      defaultFacing,
      facingCharges,
      extraLandSqYards,
      extraLandPricePerSqYard,
      paymentTillNow,
      totalSftPerVilla,
      totalSftPrice,
      extraLandTotal,
      basePriceAmount,
      balanceInBasePrice,
      newSftPerSqYard,
      newSalePricePerSft: salePriceRows[0]?.newPricePerSft || 0,
      newDefaultFacing,
      newFacingCharges,
      newExtraLandSqYards,
      newExtraLandPricePerSqYard,
      newPaymentTillNow,
      newTotalSftPerVilla,
      newTotalSftPrice,
      newExtraLandTotal,
      newBasePriceAmount,
      newBalanceInBasePrice,
      clubHouseApplicable,
      clubHouseAmount: clubHouseApplicable ? clubHouseAmount : 0,
      corpusFundApplicable,
      corpusFundAmount: corpusFundApplicable ? corpusFundAmount : 0,
      legalChargesApplicable,
      legalChargesAmount: legalChargesApplicable ? legalChargesAmount : 0,
      cautionDepositApplicable,
      cautionDepositAmount: cautionDepositApplicable ? cautionDepositAmount : 0,
      advanceMaintenanceApplicable,
      advanceMaintenanceRate,
      advanceMaintenanceMonths,
      advanceMaintenanceAmount,
      newAdvanceMaintenanceAmount,
      registrationPaymentApplicable: true,
      gstPercentage,
      gstAmount,
      newGstAmount,
      stampDutyPercentage,
      stampDutyAmount,
      newStampDutyAmount,
      salePriceRowsJson: JSON.stringify(salePriceRows),
    };

    try {
      setError("");
      if (editingId !== null) {
        await initialSalesService.update(editingId, req);
        setSuccess("Record updated successfully. You can Print / Save as PDF, or click New for a new quote.");
        setFormDisabled(true);
      } else {
        await initialSalesService.create(req);
        setSuccess("Record saved successfully. You can Print / Save as PDF, or click New for a new quote.");
        setFormDisabled(true);
      }
      await loadRecords();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save record";
      setError(msg);
    }
  }

  // ─── Edit ───
  function handleEdit(rec: InitialSaleDto) {
    isLoadingEdit.current = true;
    setFormDisabled(false);
    setEditingId(rec.id);
    setCustomerName(rec.customerName);
    setSqYardsVilla(rec.sqYardsVilla);
    setVillaNumber(rec.villaNumber);
    setSaleMode(rec.saleMode);
    setProjectName(rec.projectName || activeProject.name);
    setSftPerSqYard(rec.sftPerSqYard);
    // Restore multi-row sale price data from JSON, fallback to single row for old records
    if (rec.salePriceRowsJson) {
      try {
        const parsed = JSON.parse(rec.salePriceRowsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSalePriceRows(parsed);
        } else {
          setSalePriceRows([{ sqYards: rec.sqYardsVilla, pricePerSft: rec.salePricePerSft, newPricePerSft: rec.newSalePricePerSft }]);
        }
      } catch {
        setSalePriceRows([{ sqYards: rec.sqYardsVilla, pricePerSft: rec.salePricePerSft, newPricePerSft: rec.newSalePricePerSft }]);
      }
    } else {
      setSalePriceRows([{ sqYards: rec.sqYardsVilla, pricePerSft: rec.salePricePerSft, newPricePerSft: rec.newSalePricePerSft }]);
    }
    setDefaultFacing(rec.defaultFacing);
    setFacingCharges(rec.facingCharges);
    setExtraLandSqYards(rec.extraLandSqYards);
    setExtraLandPricePerSqYard(rec.extraLandPricePerSqYard);
    setPaymentTillNow(rec.paymentTillNow);
    setTotalSftPerVilla(rec.totalSftPerVilla);
    setNewSftPerSqYard(rec.newSftPerSqYard);
    setNewDefaultFacing(rec.newDefaultFacing);
    setNewFacingCharges(rec.newFacingCharges);
    setNewExtraLandSqYards(rec.newExtraLandSqYards);
    setNewExtraLandPricePerSqYard(rec.newExtraLandPricePerSqYard);
    setNewPaymentTillNow(rec.newPaymentTillNow);
    setNewTotalSftPerVilla(rec.newTotalSftPerVilla);
    setClubHouseApplicable(rec.clubHouseApplicable);
    setClubHouseAmount(rec.clubHouseAmount);
    setCorpusFundApplicable(rec.corpusFundApplicable);
    setCorpusFundAmount(rec.corpusFundAmount);
    setLegalChargesApplicable(rec.legalChargesApplicable);
    setLegalChargesAmount(rec.legalChargesAmount);
    setCautionDepositApplicable(rec.cautionDepositApplicable);
    setCautionDepositAmount(rec.cautionDepositAmount);
    setAdvanceMaintenanceApplicable(rec.advanceMaintenanceApplicable);
    setAdvanceMaintenanceRate(rec.advanceMaintenanceRate);
    setAdvanceMaintenanceMonths(rec.advanceMaintenanceMonths);
    setGstPercentage(rec.gstPercentage);
    setStampDutyPercentage(rec.stampDutyPercentage);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
    // Release the flag after React processes all state updates
    setTimeout(() => { isLoadingEdit.current = false; }, 0);
  }

  // ─── Delete ───
  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      setError("");
      await initialSalesService.delete(id);
      await loadRecords();
      setSuccess("Record deleted");
      setTimeout(() => setSuccess(""), 1500);
    } catch (err: any) {
      const msg =
        err?.response?.status === 403
          ? "Access denied: You do not have permission to delete"
          : err?.response?.data?.error || err?.message || "Failed to delete";
      setError(msg);
    }
  }

  // ─── Print ───
  function handlePrint() {
    const villaForFile = villaNumber && !/not\s*(yet)?\s*assigned/i.test(villaNumber.trim()) ? villaNumber.trim().replace(/\s+/g, "_") : "XXX";
    const fileName = `ArcadiaPremium_${(customerName || "Quote").trim().replace(/\s+/g, "_")}_${villaForFile}`;

    const buildRow = (sno: string, detail: string, dataInput: string, oldVal: string, newVal: string, isAuto = false, isBold = false) => {
      const bg = isAuto ? "background:#e8f4fd;" : "";
      const fw = isBold ? "font-weight:bold;" : "";
      return `<tr style="${bg}${fw}border-bottom:1px solid #ddd;">
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;width:50px">${sno}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;min-width:220px">${detail}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;min-width:100px">${dataInput}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;min-width:140px">${oldVal}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;min-width:140px">${newVal}</td>
      </tr>`;
    };

    let rows = "";
    rows += buildRow("1", "Customer Name", customerName, "", "");
    rows += buildRow("2", "SqYards Villa", String(sqYardsVilla), "", "");
    rows += buildRow("3", "Villa Number", villaNumber, "", "");
    rows += buildRow("4", "Sale Mode", saleMode, "", "");
    rows += `<tr style="background:#f0f0f0;"><td colspan="2" style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;">Calculation Details</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:11px;">Data/Input</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:11px;">Old Value</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:11px;">New Value</td></tr>`;
    rows += buildRow("5", "SFT per SqYard Construction", "", String(sftPerSqYard), String(newSftPerSqYard));
    rows += buildRow("6", "Total SFT per Villa (editable)", "= SqYds × SFT", formatINR(totalSftPerVilla), formatINR(newTotalSftPerVilla));
    // Sale Price per SFT header row for multi-row
    if (salePriceRows.length > 1) {
      rows += `<tr style="background:#f0fff0;border-bottom:1px solid #ddd;"><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">7</td><td colspan="2" style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;">Sale Price per SFT (${salePriceRows.length} entries)</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-size:11px;font-weight:bold;">Old Price/SFT</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-size:11px;font-weight:bold;">New Price/SFT</td></tr>`;
    }
    salePriceRows.forEach((r, i) => {
      rows += buildRow(salePriceRows.length === 1 ? "7" : `7.${i+1}`, `Sale Price per SFT (${r.sqYards} SqYds)`, "", formatINR(r.pricePerSft), formatINR(r.newPricePerSft));
    });
    rows += buildRow("8", "Total SFT Price", "= Σ(SqYds × SFT × Price)", formatINR(totalSftPrice), formatINR(newTotalSftPrice), true, true);
    rows += buildRow("9", "Default Facing", "", defaultFacing, newDefaultFacing);
    rows += buildRow("10", "Facing Charges", "", formatINR(facingCharges), formatINR(newFacingCharges));
    rows += buildRow("11", "Extra Land in SqYards", "", String(extraLandSqYards), String(newExtraLandSqYards));
    rows += buildRow("12", "Extra Land Price / SqYard", "", formatINR(extraLandPricePerSqYard), formatINR(newExtraLandPricePerSqYard));
    rows += buildRow("13", "Extra Land Total", "= SqYds × Price", formatINR(extraLandTotal), formatINR(newExtraLandTotal), true);
    rows += buildRow("14", "Base Price Amount", "SFT + Extra + Facing", formatINR(basePriceAmount), formatINR(newBasePriceAmount), true, true);
    rows += buildRow("15", "Payment Till Now", "", formatINR(paymentTillNow), formatINR(newPaymentTillNow));
    rows += buildRow("16", "Balance in Base Price", "= Base − Paid", formatINR(balanceInBasePrice), formatINR(newBalanceInBasePrice), true, true);
    rows += `<tr style="background:#f0f0f0;"><td colspan="5" style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;">++ Additional Charges at the time of Registration</td></tr>`;
    rows += buildRow("17", "Club House / Amenities Charges", clubHouseApplicable ? "Applicable" : "N/A", clubHouseApplicable ? formatINR(clubHouseAmount) : "N/A", clubHouseApplicable ? formatINR(clubHouseAmount) : "N/A");
    rows += buildRow("18", "Corpus Fund (one-time, non-refundable)", corpusFundApplicable ? "Applicable" : "N/A", corpusFundApplicable ? formatINR(corpusFundAmount) : "N/A", corpusFundApplicable ? formatINR(corpusFundAmount) : "N/A");
    rows += buildRow("19", "Legal & Documentation Charges", legalChargesApplicable ? "Applicable" : "N/A", legalChargesApplicable ? formatINR(legalChargesAmount) : "N/A", legalChargesApplicable ? formatINR(legalChargesAmount) : "N/A");
    rows += buildRow("20", "Refundable Caution Deposit", cautionDepositApplicable ? "Applicable" : "N/A", cautionDepositApplicable ? formatINR(cautionDepositAmount) : "N/A", cautionDepositApplicable ? formatINR(cautionDepositAmount) : "N/A");
    rows += buildRow("21", `Advance Maintenance (${advanceMaintenanceRate}/sft × ${advanceMaintenanceMonths} months)`, advanceMaintenanceApplicable ? "Applicable" : "N/A", advanceMaintenanceApplicable ? formatINR(advanceMaintenanceAmount) : "N/A", advanceMaintenanceApplicable ? formatINR(newAdvanceMaintenanceAmount) : "N/A", true);
    rows += buildRow("22", "Payment at the time of Registration", "Sum of above", formatINR(registrationPaymentOld), formatINR(registrationPaymentNew), true, true);
    rows += `<tr style="background:#f0f0f0;"><td colspan="5" style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;">Registration Charges</td></tr>`;
    rows += buildRow("23", `GST (${gstPercentage}%) on Base Price`, "auto", formatINR(gstAmount), formatINR(newGstAmount), true);
    rows += buildRow("24", `Stamp Duty & Registration (${stampDutyPercentage}%) on Base Price`, "auto", formatINR(stampDutyAmount), formatINR(newStampDutyAmount), true);

    const html = `<!DOCTYPE html>
<html><head><title>${fileName}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { color: #0275c7; margin-bottom: 4px; font-size: 20px; }
  h3 { color: #555; margin-top: 0; font-size: 14px; }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th { background: #0275c7; color: #fff; padding: 8px 10px; border: 1px solid #0275c7; text-align: center; }
</style></head>
<body>
  <h1>${activeProject.name} - Initial Sales Quote</h1>
  <h3>Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</h3>
  <table>
    <thead><tr><th>S.No</th><th>Details</th><th>Data/Input</th><th>Old Value</th><th>New Value</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`;

    const originalTitle = document.title;
    document.title = fileName;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.title = originalTitle;
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    } else {
      document.title = originalTitle;
      document.body.removeChild(iframe);
    }
  }

  // ─── Save as PDF ───
  function handleSavePDF() {
    if (!customerName.trim()) {
      setError("Please enter Customer Name before saving PDF");
      return;
    }
    if (!villaNumber.trim()) {
      setError("Please enter Villa Number before saving PDF");
      return;
    }
    const villaForFile = villaNumber && !/not\s*(yet)?\s*assigned/i.test(villaNumber.trim()) ? villaNumber.trim().replace(/\s+/g, "_") : "XXX";
    const fileName = `ArcadiaPremium_${customerName.trim().replace(/\s+/g, "_")}_${villaForFile}`;

    const buildRow = (sno: string, detail: string, dataInput: string, oldVal: string, newVal: string, isAuto = false, isBold = false) => {
      const bg = isAuto ? "background:#e8f4fd;" : "";
      const fw = isBold ? "font-weight:bold;" : "";
      return `<tr style="${bg}${fw}border-bottom:1px solid #ddd;">
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;width:50px">${sno}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;min-width:220px">${detail}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;min-width:100px">${dataInput}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;min-width:140px">${oldVal}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;min-width:140px">${newVal}</td>
      </tr>`;
    };

    let rows = "";
    rows += buildRow("1", "Customer Name", customerName, "", "");
    rows += buildRow("2", "SqYards Villa", String(sqYardsVilla), "", "");
    rows += buildRow("3", "Villa Number", villaNumber, "", "");
    rows += buildRow("4", "Sale Mode", saleMode, "", "");
    rows += `<tr style="background:#f0f0f0;"><td colspan="2" style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;">Calculation Details</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:11px;">Data/Input</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:11px;">Old Value</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:11px;">New Value</td></tr>`;
    rows += buildRow("5", "SFT per SqYard Construction", "", String(sftPerSqYard), String(newSftPerSqYard));
    rows += buildRow("6", "Total SFT per Villa (editable)", "= SqYds × SFT", formatINR(totalSftPerVilla), formatINR(newTotalSftPerVilla));
    // Sale Price per SFT header row for multi-row
    if (salePriceRows.length > 1) {
      rows += `<tr style="background:#f0fff0;border-bottom:1px solid #ddd;"><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">7</td><td colspan="2" style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;">Sale Price per SFT (${salePriceRows.length} entries)</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-size:11px;font-weight:bold;">Old Price/SFT</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-size:11px;font-weight:bold;">New Price/SFT</td></tr>`;
    }
    salePriceRows.forEach((r, i) => {
      rows += buildRow(salePriceRows.length === 1 ? "7" : `7.${i+1}`, `Sale Price per SFT (${r.sqYards} SqYds)`, "", formatINR(r.pricePerSft), formatINR(r.newPricePerSft));
    });
    rows += buildRow("8", "Total SFT Price", "= Σ(SqYds × SFT × Price)", formatINR(totalSftPrice), formatINR(newTotalSftPrice), true, true);
    rows += buildRow("9", "Default Facing", "", defaultFacing, newDefaultFacing);
    rows += buildRow("10", "Facing Charges", "", formatINR(facingCharges), formatINR(newFacingCharges));
    rows += buildRow("11", "Extra Land in SqYards", "", String(extraLandSqYards), String(newExtraLandSqYards));
    rows += buildRow("12", "Extra Land Price / SqYard", "", formatINR(extraLandPricePerSqYard), formatINR(newExtraLandPricePerSqYard));
    rows += buildRow("13", "Extra Land Total", "= SqYds × Price", formatINR(extraLandTotal), formatINR(newExtraLandTotal), true);
    rows += buildRow("14", "Base Price Amount", "SFT + Extra + Facing", formatINR(basePriceAmount), formatINR(newBasePriceAmount), true, true);
    rows += buildRow("15", "Payment Till Now", "", formatINR(paymentTillNow), formatINR(newPaymentTillNow));
    rows += buildRow("16", "Balance in Base Price", "= Base − Paid", formatINR(balanceInBasePrice), formatINR(newBalanceInBasePrice), true, true);
    rows += `<tr style="background:#f0f0f0;"><td colspan="5" style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;">++ Additional Charges at the time of Registration</td></tr>`;
    rows += buildRow("17", "Club House / Amenities Charges", clubHouseApplicable ? "Applicable" : "N/A", clubHouseApplicable ? formatINR(clubHouseAmount) : "N/A", clubHouseApplicable ? formatINR(clubHouseAmount) : "N/A");
    rows += buildRow("18", "Corpus Fund (one-time, non-refundable)", corpusFundApplicable ? "Applicable" : "N/A", corpusFundApplicable ? formatINR(corpusFundAmount) : "N/A", corpusFundApplicable ? formatINR(corpusFundAmount) : "N/A");
    rows += buildRow("19", "Legal & Documentation Charges", legalChargesApplicable ? "Applicable" : "N/A", legalChargesApplicable ? formatINR(legalChargesAmount) : "N/A", legalChargesApplicable ? formatINR(legalChargesAmount) : "N/A");
    rows += buildRow("20", "Refundable Caution Deposit", cautionDepositApplicable ? "Applicable" : "N/A", cautionDepositApplicable ? formatINR(cautionDepositAmount) : "N/A", cautionDepositApplicable ? formatINR(cautionDepositAmount) : "N/A");
    rows += buildRow("21", `Advance Maintenance (${advanceMaintenanceRate}/sft × ${advanceMaintenanceMonths} months)`, advanceMaintenanceApplicable ? "Applicable" : "N/A", advanceMaintenanceApplicable ? formatINR(advanceMaintenanceAmount) : "N/A", advanceMaintenanceApplicable ? formatINR(newAdvanceMaintenanceAmount) : "N/A", true);
    rows += buildRow("22", "Payment at the time of Registration", "Sum of above", formatINR(registrationPaymentOld), formatINR(registrationPaymentNew), true, true);
    rows += `<tr style="background:#f0f0f0;"><td colspan="5" style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;">Registration Charges</td></tr>`;
    rows += buildRow("23", `GST (${gstPercentage}%) on Base Price`, "auto", formatINR(gstAmount), formatINR(newGstAmount), true);
    rows += buildRow("24", `Stamp Duty & Registration (${stampDutyPercentage}%) on Base Price`, "auto", formatINR(stampDutyAmount), formatINR(newStampDutyAmount), true);

    const pdfHtml = `<!DOCTYPE html><html><head>
      <title>${fileName}</title>
      <style>
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th { background: #0275c7; color: #fff; padding: 8px 10px; border: 1px solid #0275c7; text-align: center; }
      </style>
    </head><body>
      <h1 style="color:#0275c7;margin-bottom:4px;font-size:20px;">${activeProject.name} - Initial Sales Quote</h1>
      <h3 style="color:#555;margin-top:0;font-size:14px;">Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</h3>
      <table>
        <thead><tr><th>S.No</th><th>Details</th><th>Data/Input</th><th>Old Value</th><th>New Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;

    const originalTitle = document.title;
    document.title = fileName;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(pdfHtml);
      iframeDoc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.title = originalTitle;
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    } else {
      document.title = originalTitle;
      document.body.removeChild(iframe);
    }
  }

  // ─── Export Excel ───
  function handleExportExcel() {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/><style>td,th{border:1px solid #999;padding:6px 10px;font-family:Arial}th{background:#0275c7;color:#fff;font-weight:bold}.right{text-align:right}.bold{font-weight:bold}.total{font-weight:bold;background:#e8f4fd}</style></head><body>`;
    html += `<table>`;
    html += `<tr><td colspan="10" style="font-size:18px;font-weight:bold;color:#0275c7">${activeProject.name} - Initial Sales Records</td></tr>`;
    html += `<tr><td colspan="10"></td></tr>`;
    html += `<tr><th>S.No</th><th>Customer</th><th>Villa No</th><th>SqYards</th><th>Sale Mode</th><th>Facing</th><th>Base Price (Old)</th><th>Base Price (New)</th><th>Balance (Old)</th><th>Balance (New)</th><th>Date</th></tr>`;
    records.forEach((r, i) => {
      html += `<tr><td>${i + 1}</td><td>${r.customerName}</td><td>${r.villaNumber}</td><td>${r.sqYardsVilla}</td><td>${r.saleMode}</td><td>${r.defaultFacing}</td><td class="right">${r.basePriceAmount}</td><td class="right">${r.newBasePriceAmount}</td><td class="right">${r.balanceInBasePrice}</td><td class="right">${r.newBalanceInBasePrice}</td><td>${formatDate(r.createdAt)}</td></tr>`;
    });
    const totalOldBase = records.reduce((s, r) => s + r.basePriceAmount, 0);
    const totalNewBase = records.reduce((s, r) => s + r.newBasePriceAmount, 0);
    const totalOldBalance = records.reduce((s, r) => s + r.balanceInBasePrice, 0);
    const totalNewBalance = records.reduce((s, r) => s + r.newBalanceInBasePrice, 0);
    html += `<tr class="total"><td colspan="6" class="right bold">Totals:</td><td class="right">${totalOldBase}</td><td class="right">${totalNewBase}</td><td class="right">${totalOldBalance}</td><td class="right">${totalNewBalance}</td><td></td></tr>`;
    html += `</table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Initial_Sales_Records.xls";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Helpers for input rendering ───
  const numInput = (val: number, set: (v: number) => void, placeholder = "", disabled = false) => {
    const isDisabled = disabled || formDisabled;
    return (
      <input
        type="number"
        value={val !== null && val !== undefined ? val : ""}
        onChange={(e) => {
          const v = e.target.value;
          set(v === "" ? 0 : Number(v));
        }}
        placeholder={placeholder}
        disabled={isDisabled}
        className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:ring-2 focus:ring-arcadia-400 focus:outline-none ${isDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
      />
    );
  };

  function addSalePriceRow() {
    setSalePriceRows([...salePriceRows, { sqYards: 0, pricePerSft: 0, newPricePerSft: 0 }]);
  }
  function removeSalePriceRow(idx: number) {
    if (salePriceRows.length <= 1) return;
    setSalePriceRows(salePriceRows.filter((_, i) => i !== idx));
  }
  function updateSalePriceRow(idx: number, field: string, value: number) {
    setSalePriceRows(salePriceRows.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  const autoField = (val: number) => (
    <span className="block w-full bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-sm text-right font-medium text-gray-700">
      {formatINR(val)}
    </span>
  );

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Initial Sales</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-600">Project:</label>
          <select
            value={activeProject.key}
            onChange={(e) => {
              const proj = PROJECTS.find((p) => p.key === e.target.value);
              if (proj) {
                setPageProject(proj);
                setProjectName(proj.name);
              }
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-400 focus:outline-none"
          >
            {PROJECTS.map((p) => (
              <option key={p.key} value={p.key}>{p.shortName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Error / Success Banners ── */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold ml-4">&times;</button>
        </div>
      )}
      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{success}</div>
      )}

      {/* ═══════════════════════════════════════════
          FORM SECTION
          ═══════════════════════════════════════════ */}
      <div ref={formRef} className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-arcadia-200 bg-arcadia-50">
          <h2 className="text-lg font-bold text-arcadia-700">
            {editingId ? "Edit Sales Quote" : "New Sales Quote"}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-arcadia-600 text-white">
                <th className="px-3 py-2.5 text-center font-semibold w-14">S.No</th>
                <th className="px-3 py-2.5 text-left font-semibold min-w-[220px]">Details</th>
                <th className="px-3 py-2.5 text-center font-semibold w-32">Data / Input</th>
                <th className="px-3 py-2.5 text-center font-semibold w-44">Old Value</th>
                <th className="px-3 py-2.5 text-center font-semibold w-44">New Value</th>
              </tr>
            </thead>
            <tbody>
              {/* ── Basic Info ── */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">1</td>
                <td className="px-3 py-2 font-medium">Customer Name <span className="text-red-500">*</span></td>
                <td colSpan={3} className="px-3 py-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    disabled={formDisabled}
                    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-arcadia-400 focus:outline-none ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50/40 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">2</td>
                <td className="px-3 py-2 font-medium">SqYards Villa</td>
                <td colSpan={3} className="px-3 py-2">
                  {numInput(sqYardsVilla, setSqYardsVilla, "e.g. 200", formDisabled)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">3</td>
                <td className="px-3 py-2 font-medium">Villa Number <span className="text-red-500">*</span></td>
                <td colSpan={3} className="px-3 py-2">
                  <input
                    type="text"
                    value={villaNumber}
                    onChange={(e) => setVillaNumber(e.target.value)}
                    placeholder="e.g. V-101"
                    disabled={formDisabled}
                    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-arcadia-400 focus:outline-none ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50/40 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">4</td>
                <td className="px-3 py-2 font-medium">Sale Mode</td>
                <td colSpan={3} className="px-3 py-2">
                  <select
                    value={saleMode}
                    onChange={(e) => setSaleMode(e.target.value)}
                    disabled={formDisabled}
                    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-arcadia-400 focus:outline-none ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  >
                    {SALE_MODES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </td>
              </tr>

              {/* ── Section Header: Calculation ── */}
              <tr className="bg-arcadia-50">
                <td colSpan={2} className="px-3 py-2 font-bold text-arcadia-700 text-sm">Calculation Details</td>
                <td className="px-3 py-2 text-center font-semibold text-arcadia-600 text-xs">Data / Input</td>
                <td className="px-3 py-2 text-center font-semibold text-arcadia-600 text-xs">Old Value</td>
                <td className="px-3 py-2 text-center font-semibold text-arcadia-600 text-xs">New Value</td>
              </tr>

              {/* SFT per SqYard */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">5</td>
                <td className="px-3 py-2 font-medium">SFT per SqYard Construction</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">{numInput(sftPerSqYard, setSftPerSqYard)}</td>
                <td className="px-3 py-2">{numInput(newSftPerSqYard, setNewSftPerSqYard)}</td>
              </tr>
              {/* Total SFT per Villa (editable for customization) */}
              <tr className="border-b border-gray-100 bg-amber-50/40 hover:bg-amber-50/60">
                <td className="px-3 py-2 text-center text-gray-500">6</td>
                <td className="px-3 py-2 font-medium text-amber-700">Total SFT per Villa <span className="text-xs text-amber-500 ml-1">(editable)</span></td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">= SqYds x SFT</td>
                <td className="px-3 py-2">{numInput(totalSftPerVilla, setTotalSftPerVilla)}</td>
                <td className="px-3 py-2">{numInput(newTotalSftPerVilla, setNewTotalSftPerVilla)}</td>
              </tr>
              {/* Sale Price per SFT - Multiple Rows */}
              <tr className="border-b border-gray-100 bg-green-50/30">
                <td className="px-3 py-2 text-center text-gray-500">7</td>
                <td className="px-3 py-2 font-medium" colSpan={2}>
                  Sale Price per SFT
                  {!formDisabled && (
                    <button onClick={addSalePriceRow} className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition">+ Add</button>
                  )}
                </td>
                <td className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Old Price/SFT</td>
                <td className="px-3 py-2 text-center text-xs font-semibold text-gray-500">New Price/SFT</td>
              </tr>
              {salePriceRows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-center text-gray-400 text-xs">{`7.${idx + 1}`}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400 whitespace-nowrap">SqYds:</span>
                      {numInput(row.sqYards, (v) => updateSalePriceRow(idx, "sqYards", v), "SqYards")}
                      {!formDisabled && salePriceRows.length > 1 && (
                        <button onClick={() => removeSalePriceRow(idx)} className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition" title="Remove row">×</button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2">{numInput(row.pricePerSft, (v) => updateSalePriceRow(idx, "pricePerSft", v), "Price/SFT")}</td>
                  <td className="px-3 py-2">{numInput(row.newPricePerSft, (v) => updateSalePriceRow(idx, "newPricePerSft", v), "Price/SFT")}</td>
                </tr>
              ))}
              {/* Total SFT Price (AUTO) */}
              <tr className="border-b border-gray-100 bg-blue-50/30 hover:bg-blue-50/50">
                <td className="px-3 py-2 text-center text-gray-500">8</td>
                <td className="px-3 py-2 font-medium text-blue-700">Total SFT Price <span className="text-xs text-blue-400 ml-1">(auto)</span></td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">= Σ(SqYds × SFT × Price)</td>
                <td className="px-3 py-2">{autoField(totalSftPrice)}</td>
                <td className="px-3 py-2">{autoField(newTotalSftPrice)}</td>
              </tr>
              {/* Default Facing */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">9</td>
                <td className="px-3 py-2 font-medium">Default Facing</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">
                  <select value={defaultFacing} onChange={(e) => setDefaultFacing(e.target.value)}
                    disabled={formDisabled}
                    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-arcadia-400 focus:outline-none ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}>
                    {FACING_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select value={newDefaultFacing} onChange={(e) => setNewDefaultFacing(e.target.value)}
                    disabled={formDisabled}
                    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-arcadia-400 focus:outline-none ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}>
                    {FACING_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </td>
              </tr>
              {/* Facing Charges */}
              <tr className="border-b border-gray-100 bg-gray-50/40 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">10</td>
                <td className="px-3 py-2 font-medium">Facing Charges</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">{numInput(facingCharges, setFacingCharges)}</td>
                <td className="px-3 py-2">{numInput(newFacingCharges, setNewFacingCharges)}</td>
              </tr>
              {/* Extra Land SqYards */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">11</td>
                <td className="px-3 py-2 font-medium">Extra Land in SqYards</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">{numInput(extraLandSqYards, setExtraLandSqYards)}</td>
                <td className="px-3 py-2">{numInput(newExtraLandSqYards, setNewExtraLandSqYards)}</td>
              </tr>
              {/* Extra Land Price per SqYard */}
              <tr className="border-b border-gray-100 bg-gray-50/40 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">12</td>
                <td className="px-3 py-2 font-medium">Extra Land Price / SqYard</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">{numInput(extraLandPricePerSqYard, setExtraLandPricePerSqYard)}</td>
                <td className="px-3 py-2">{numInput(newExtraLandPricePerSqYard, setNewExtraLandPricePerSqYard)}</td>
              </tr>
              {/* Extra Land Total (AUTO) */}
              <tr className="border-b border-gray-100 bg-blue-50/30 hover:bg-blue-50/50">
                <td className="px-3 py-2 text-center text-gray-500">13</td>
                <td className="px-3 py-2 font-medium text-blue-700">Extra Land Total <span className="text-xs text-blue-400 ml-1">(auto)</span></td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">= SqYds x Price</td>
                <td className="px-3 py-2">{autoField(extraLandTotal)}</td>
                <td className="px-3 py-2">{autoField(newExtraLandTotal)}</td>
              </tr>
              {/* Base Price Amount (AUTO, BOLD) */}
              <tr className="border-b-2 border-arcadia-200 bg-arcadia-50 hover:bg-arcadia-100">
                <td className="px-3 py-2.5 text-center font-bold text-arcadia-700">14</td>
                <td className="px-3 py-2.5 font-bold text-arcadia-700">Base Price Amount <span className="text-xs font-normal text-arcadia-400 ml-1">(auto)</span></td>
                <td className="px-3 py-2.5 text-center text-xs text-arcadia-400">SFT + Extra + Facing</td>
                <td className="px-3 py-2.5">
                  <span className="block w-full bg-arcadia-100 border border-arcadia-300 rounded px-2 py-1.5 text-sm text-right font-bold text-arcadia-800">
                    {formatINR(basePriceAmount)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="block w-full bg-arcadia-100 border border-arcadia-300 rounded px-2 py-1.5 text-sm text-right font-bold text-arcadia-800">
                    {formatINR(newBasePriceAmount)}
                  </span>
                </td>
              </tr>
              {/* Payment Till Now */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">15</td>
                <td className="px-3 py-2 font-medium">Payment Till Now</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">{numInput(paymentTillNow, setPaymentTillNow)}</td>
                <td className="px-3 py-2">{numInput(newPaymentTillNow, setNewPaymentTillNow)}</td>
              </tr>
              {/* Balance in Base Price (AUTO, BOLD) */}
              <tr className="border-b-2 border-amber-200 bg-amber-50 hover:bg-amber-100">
                <td className="px-3 py-2.5 text-center font-bold text-amber-800">16</td>
                <td className="px-3 py-2.5 font-bold text-amber-800">Balance in Base Price <span className="text-xs font-normal text-amber-500 ml-1">(auto)</span></td>
                <td className="px-3 py-2.5 text-center text-xs text-amber-500">= Base - Paid</td>
                <td className="px-3 py-2.5">
                  <span className="block w-full bg-amber-100 border border-amber-300 rounded px-2 py-1.5 text-sm text-right font-bold text-amber-900">
                    {formatINR(balanceInBasePrice)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="block w-full bg-amber-100 border border-amber-300 rounded px-2 py-1.5 text-sm text-right font-bold text-amber-900">
                    {formatINR(newBalanceInBasePrice)}
                  </span>
                </td>
              </tr>

              {/* ── Section Header: Additional Charges ── */}
              <tr className="bg-arcadia-50">
                <td colSpan={5} className="px-3 py-2 font-bold text-arcadia-700 text-sm">++ Additional Charges at the time of Registration</td>
              </tr>

              {/* Club House */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">17</td>
                <td className="px-3 py-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={clubHouseApplicable}
                      onChange={(e) => setClubHouseApplicable(e.target.checked)}
                      disabled={formDisabled || saleMode === "OTP"}
                      className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500"
                    />
                    <span className="font-medium">Club House / Amenities Charges</span>
                    {saleMode === "OTP" && <span className="text-xs text-orange-500 ml-1">(N/A for OTP)</span>}
                  </label>
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">{clubHouseApplicable ? "Applicable" : "N/A"}</td>
                <td className="px-3 py-2">{clubHouseApplicable ? numInput(clubHouseAmount, setClubHouseAmount) : <span className="text-gray-400 text-sm">N/A</span>}</td>
                <td className="px-3 py-2">{clubHouseApplicable ? numInput(clubHouseAmount, setClubHouseAmount) : <span className="text-gray-400 text-sm">N/A</span>}</td>
              </tr>
              {/* Corpus Fund */}
              <tr className="border-b border-gray-100 bg-gray-50/40 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">18</td>
                <td className="px-3 py-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={corpusFundApplicable} onChange={(e) => setCorpusFundApplicable(e.target.checked)}
                      disabled={formDisabled}
                      className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500" />
                    <span className="font-medium">Corpus Fund <span className="text-xs text-gray-400">(one-time, non-refundable)</span></span>
                  </label>
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">{corpusFundApplicable ? "Applicable" : "N/A"}</td>
                <td className="px-3 py-2">{corpusFundApplicable ? numInput(corpusFundAmount, setCorpusFundAmount) : <span className="text-gray-400 text-sm">N/A</span>}</td>
                <td className="px-3 py-2">{corpusFundApplicable ? numInput(corpusFundAmount, setCorpusFundAmount) : <span className="text-gray-400 text-sm">N/A</span>}</td>
              </tr>
              {/* Legal Charges */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">19</td>
                <td className="px-3 py-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={legalChargesApplicable} onChange={(e) => setLegalChargesApplicable(e.target.checked)}
                      disabled={formDisabled}
                      className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500" />
                    <span className="font-medium">Legal & Documentation Charges</span>
                  </label>
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">{legalChargesApplicable ? "Applicable" : "N/A"}</td>
                <td className="px-3 py-2">{legalChargesApplicable ? numInput(legalChargesAmount, setLegalChargesAmount) : <span className="text-gray-400 text-sm">N/A</span>}</td>
                <td className="px-3 py-2">{legalChargesApplicable ? numInput(legalChargesAmount, setLegalChargesAmount) : <span className="text-gray-400 text-sm">N/A</span>}</td>
              </tr>
              {/* Caution Deposit */}
              <tr className="border-b border-gray-100 bg-gray-50/40 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">20</td>
                <td className="px-3 py-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={cautionDepositApplicable} onChange={(e) => setCautionDepositApplicable(e.target.checked)}
                      disabled={formDisabled}
                      className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500" />
                    <span className="font-medium">Refundable Caution Deposit</span>
                  </label>
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">{cautionDepositApplicable ? "Applicable" : "N/A"}</td>
                <td className="px-3 py-2">{cautionDepositApplicable ? numInput(cautionDepositAmount, setCautionDepositAmount) : <span className="text-gray-400 text-sm">N/A</span>}</td>
                <td className="px-3 py-2">{cautionDepositApplicable ? numInput(cautionDepositAmount, setCautionDepositAmount) : <span className="text-gray-400 text-sm">N/A</span>}</td>
              </tr>
              {/* Advance Maintenance */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">21</td>
                <td className="px-3 py-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={advanceMaintenanceApplicable} onChange={(e) => setAdvanceMaintenanceApplicable(e.target.checked)}
                      disabled={formDisabled}
                      className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500" />
                    <span className="font-medium">Advance Maintenance</span>
                  </label>
                  {advanceMaintenanceApplicable && (
                    <div className="flex items-center gap-2 mt-1 ml-6 text-xs text-gray-500">
                      <span>Rate:</span>
                      <input type="number" value={advanceMaintenanceRate} onChange={(e) => setAdvanceMaintenanceRate(Number(e.target.value) || 0)}
                        disabled={formDisabled}
                        className={`w-16 border border-gray-300 rounded px-1 py-0.5 text-xs text-right ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`} step="0.5" />
                      <span>/sft x TotalSFT x</span>
                      <input type="number" value={advanceMaintenanceMonths} onChange={(e) => setAdvanceMaintenanceMonths(Number(e.target.value) || 0)}
                        disabled={formDisabled}
                        className={`w-14 border border-gray-300 rounded px-1 py-0.5 text-xs text-right ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`} />
                      <span>months</span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">{advanceMaintenanceApplicable ? "Applicable" : "N/A"}</td>
                <td className="px-3 py-2">
                  {advanceMaintenanceApplicable ? autoField(advanceMaintenanceAmount) : <span className="text-gray-400 text-sm">N/A</span>}
                </td>
                <td className="px-3 py-2">
                  {advanceMaintenanceApplicable ? autoField(newAdvanceMaintenanceAmount) : <span className="text-gray-400 text-sm">N/A</span>}
                </td>
              </tr>
              {/* Registration Payment Total (AUTO, BOLD) */}
              <tr className="border-b-2 border-green-200 bg-green-50 hover:bg-green-100">
                <td className="px-3 py-2.5 text-center font-bold text-green-800">22</td>
                <td className="px-3 py-2.5 font-bold text-green-800">Payment at the time of Registration <span className="text-xs font-normal text-green-500 ml-1">(auto)</span></td>
                <td className="px-3 py-2.5 text-center text-xs text-green-500">Sum of above</td>
                <td className="px-3 py-2.5">
                  <span className="block w-full bg-green-100 border border-green-300 rounded px-2 py-1.5 text-sm text-right font-bold text-green-900">
                    {formatINR(registrationPaymentOld)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="block w-full bg-green-100 border border-green-300 rounded px-2 py-1.5 text-sm text-right font-bold text-green-900">
                    {formatINR(registrationPaymentNew)}
                  </span>
                </td>
              </tr>

              {/* ── Section Header: Registration Charges ── */}
              <tr className="bg-arcadia-50">
                <td colSpan={5} className="px-3 py-2 font-bold text-arcadia-700 text-sm">Registration Charges</td>
              </tr>

              {/* GST */}
              <tr className="border-b border-gray-100 bg-blue-50/30 hover:bg-blue-50/50">
                <td className="px-3 py-2 text-center text-gray-500">23</td>
                <td className="px-3 py-2 font-medium">
                  <div className="flex items-center gap-2">
                    <span>GST</span>
                    <span className="text-xs text-gray-400">(</span>
                    <input type="number" value={gstPercentage} onChange={(e) => setGstPercentage(Number(e.target.value) || 0)}
                      disabled={formDisabled}
                      className={`w-14 border border-gray-300 rounded px-1 py-0.5 text-xs text-right ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`} step="0.5" />
                    <span className="text-xs text-gray-400">%) on Base Price</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">auto</td>
                <td className="px-3 py-2">{autoField(gstAmount)}</td>
                <td className="px-3 py-2">{autoField(newGstAmount)}</td>
              </tr>
              {/* Stamp Duty */}
              <tr className="border-b border-gray-100 bg-blue-50/30 hover:bg-blue-50/50">
                <td className="px-3 py-2 text-center text-gray-500">24</td>
                <td className="px-3 py-2 font-medium">
                  <div className="flex items-center gap-2">
                    <span>Stamp Duty & Registration</span>
                    <span className="text-xs text-gray-400">(</span>
                    <input type="number" value={stampDutyPercentage} onChange={(e) => setStampDutyPercentage(Number(e.target.value) || 0)}
                      disabled={formDisabled}
                      className={`w-14 border border-gray-300 rounded px-1 py-0.5 text-xs text-right ${formDisabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`} step="0.1" />
                    <span className="text-xs text-gray-400">%) on Base Price</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-400">auto</td>
                <td className="px-3 py-2">{autoField(stampDutyAmount)}</td>
                <td className="px-3 py-2">{autoField(newStampDutyAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Action Buttons ── */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-3">
          {formDisabled && (
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold shadow transition"
            >
              + New
            </button>
          )}
          {!formDisabled && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 text-sm font-semibold shadow transition"
            >
              {editingId ? "Update" : "Save"}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold shadow transition"
          >
            Print
          </button>
          <button
            onClick={handleSavePDF}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold shadow transition"
          >
            Save as PDF
          </button>
          {!formDisabled && (
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-semibold shadow transition"
            >
              Clear
            </button>
          )}
          {downloadEnabled && (
          <button
            onClick={() => setShowExportPopup(true)}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold shadow transition"
          >
            Export Records
          </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SAVED RECORDS TABLE
          ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-amber-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-900">Saved Records ({records.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No records yet. Create a sales quote above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-900 text-white">
                  <th className="px-3 py-3 text-left font-semibold">S.No</th>
                  <th className="px-3 py-3 text-left font-semibold">Customer Name</th>
                  <th className="px-3 py-3 text-left font-semibold">Villa No</th>
                  <th className="px-3 py-3 text-center font-semibold">SqYards</th>
                  <th className="px-3 py-3 text-center font-semibold">Sale Mode</th>
                  <th className="px-3 py-3 text-center font-semibold">Facing</th>
                  <th className="px-3 py-3 text-right font-semibold">Base Price (Old)</th>
                  <th className="px-3 py-3 text-right font-semibold">Base Price (New)</th>
                  <th className="px-3 py-3 text-right font-semibold">Balance (Old)</th>
                  <th className="px-3 py-3 text-right font-semibold">Balance (New)</th>
                  <th className="px-3 py-3 text-center font-semibold">Date</th>
                  <th className="px-3 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    className={`border-b border-gray-100 hover:bg-amber-50 transition ${i % 2 === 1 ? "bg-amber-50/40" : ""}`}
                  >
                    <td className="px-3 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-3 font-medium">{rec.customerName}</td>
                    <td className="px-3 py-3">{rec.villaNumber}</td>
                    <td className="px-3 py-3 text-center">{rec.sqYardsVilla}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${rec.saleMode === "OTP" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {rec.saleMode}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">{rec.defaultFacing}</td>
                    <td className="px-3 py-3 text-right font-mono font-medium">{formatINR(rec.basePriceAmount)}</td>
                    <td className="px-3 py-3 text-right font-mono font-medium">{formatINR(rec.newBasePriceAmount)}</td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-amber-700">{formatINR(rec.balanceInBasePrice)}</td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-amber-700">{formatINR(rec.newBalanceInBasePrice)}</td>
                    <td className="px-3 py-3 text-center text-gray-500">{formatDate(rec.createdAt)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(rec)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          EXPORT POPUP MODAL
          ═══════════════════════════════════════════ */}
      {showExportPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Initial Sales Records - Export</h2>
              <button
                onClick={() => setShowExportPopup(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Summary Cards */}
            <div className="p-5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-arcadia-50 rounded-lg p-4">
                <div className="text-sm text-arcadia-600 font-medium">Total Records</div>
                <div className="text-2xl font-bold text-arcadia-800">{records.length}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Old Base Price</div>
                <div className="text-xl font-bold text-blue-800">{formatINR(records.reduce((s, r) => s + r.basePriceAmount, 0))}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Total New Base Price</div>
                <div className="text-xl font-bold text-green-800">{formatINR(records.reduce((s, r) => s + r.newBasePriceAmount, 0))}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="text-sm text-amber-600 font-medium">Total Balance (New)</div>
                <div className="text-xl font-bold text-amber-800">{formatINR(records.reduce((s, r) => s + r.newBalanceInBasePrice, 0))}</div>
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="flex-1 overflow-auto p-5">
              {records.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No records to export</div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left font-semibold border border-gray-200">S.No</th>
                      <th className="px-3 py-2 text-left font-semibold border border-gray-200">Customer</th>
                      <th className="px-3 py-2 text-left font-semibold border border-gray-200">Villa</th>
                      <th className="px-3 py-2 text-center font-semibold border border-gray-200">SqYds</th>
                      <th className="px-3 py-2 text-center font-semibold border border-gray-200">Mode</th>
                      <th className="px-3 py-2 text-right font-semibold border border-gray-200">Base (Old)</th>
                      <th className="px-3 py-2 text-right font-semibold border border-gray-200">Base (New)</th>
                      <th className="px-3 py-2 text-right font-semibold border border-gray-200">Balance (Old)</th>
                      <th className="px-3 py-2 text-right font-semibold border border-gray-200">Balance (New)</th>
                      <th className="px-3 py-2 text-right font-semibold border border-gray-200">GST (Old)</th>
                      <th className="px-3 py-2 text-right font-semibold border border-gray-200">Stamp Duty</th>
                      <th className="px-3 py-2 text-center font-semibold border border-gray-200">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, i) => (
                      <tr key={rec.id} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                        <td className="px-3 py-2 border border-gray-200">{i + 1}</td>
                        <td className="px-3 py-2 border border-gray-200 font-medium">{rec.customerName}</td>
                        <td className="px-3 py-2 border border-gray-200">{rec.villaNumber}</td>
                        <td className="px-3 py-2 border border-gray-200 text-center">{rec.sqYardsVilla}</td>
                        <td className="px-3 py-2 border border-gray-200 text-center">{rec.saleMode}</td>
                        <td className="px-3 py-2 border border-gray-200 text-right font-mono">{formatINR(rec.basePriceAmount)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-right font-mono">{formatINR(rec.newBasePriceAmount)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-right font-mono">{formatINR(rec.balanceInBasePrice)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-right font-mono">{formatINR(rec.newBalanceInBasePrice)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-right font-mono">{formatINR(rec.gstAmount)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-right font-mono">{formatINR(rec.stampDutyAmount)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-center">{formatDate(rec.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleExportExcel}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold shadow transition"
              >
                Export to Excel
              </button>
              <button
                onClick={() => setShowExportPopup(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
