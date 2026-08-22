import { useEffect, useState, useRef, useCallback } from "react";
import { useProject } from "../contexts/ProjectContext";
import { useDownloadEnabled } from "../components/ViewOnlyWrapper";
import { invoiceBookService, type InvoiceBookEntryDto } from "../services/invoiceBookService";

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
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

/* ═══════════════════════════════════════════
   CAMERA / IMAGE CAPTURE COMPONENT
   ═══════════════════════════════════════════ */
function InvoiceImageCapture({
  imagePreview,
  onCapture,
  onClear,
}: {
  imagePreview: string;
  onCapture: (base64: string) => void;
  onClear: () => void;
}) {
  type CaptureMode = "camera" | "upload";
  const [captureMode, setCaptureMode] = useState<CaptureMode>("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      video.play().catch(console.error);
    }
  }, [cameraActive]);

  async function startCamera() {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API not available. Make sure you are using HTTPS.");
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      const name = err?.name || "Unknown";
      if (name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in browser settings, then reload.");
      } else if (name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (name === "NotReadableError") {
        setCameraError("Camera is in use by another app. Close other apps and try again.");
      } else {
        setCameraError(`Camera error (${name}): ${err?.message || "Unknown"}`);
      }
      console.error("Camera access error:", name, err);
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera not ready yet. Please wait a moment and try again.");
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(base64);
    stopCamera();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onCapture(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleModeSwitch(mode: CaptureMode) {
    stopCamera();
    setCaptureMode(mode);
    setCameraError("");
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Image</label>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => handleModeSwitch("camera")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
            captureMode === "camera"
              ? "bg-white text-arcadia-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Capture
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch("upload")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
            captureMode === "upload"
              ? "bg-white text-arcadia-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Upload
        </button>
      </div>

      {/* Camera Mode */}
      {captureMode === "camera" && !imagePreview && (
        <div className="space-y-3">
          {cameraError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {cameraError}
            </div>
          )}
          {!cameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-2 border-dashed border-arcadia-300 text-arcadia-700 rounded-xl hover:bg-arcadia-50 hover:border-arcadia-400 transition w-full justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open Camera to Capture Invoice
            </button>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden border-2 border-arcadia-300 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-64 object-cover" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Upload Mode */}
      {captureMode === "upload" && !imagePreview && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-2 border-dashed border-arcadia-300 text-arcadia-700 rounded-xl hover:bg-arcadia-50 hover:border-arcadia-400 transition w-full justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Choose File to Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mt-2">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Invoice" className="max-h-48 rounded-xl border-2 border-green-300 shadow-sm" />
            <button
              type="button"
              onClick={() => { onClear(); stopCamera(); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow hover:bg-red-600 transition"
            >
              x
            </button>
          </div>
          <p className="mt-1 text-xs text-green-600 font-medium">Invoice image attached</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
type TabKey = "invoiceEntry" | "paymentEntry";

/* ═══════════════════════════════════════════
   EMPTY FORM
   ═══════════════════════════════════════════ */
const EMPTY_FORM: InvoiceBookEntryDto = {
  invoiceNo: "",
  supplierContractorName: "",
  invoiceDate: toISODate(new Date()),
  invoiceValue: 0,
  materialWorkDetails: "",
  invoiceNarration: "",
  updatedInTally: false,
  entryMode: "MANUAL",
  invoiceImageBase64: "",
};

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function InvoiceBookPage() {
  const { activeProject } = useProject();
  const downloadEnabled = useDownloadEnabled();
  const [activeTab, setActiveTab] = useState<TabKey>("invoiceEntry");

  const projectName = activeProject.name;

  /* ── State ── */
  const [entries, setEntries] = useState<InvoiceBookEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ── Form ── */
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<InvoiceBookEntryDto>({ ...EMPTY_FORM });
  const [entryMode, setEntryMode] = useState<"MANUAL" | "IMAGE">("MANUAL");
  const [imagePreview, setImagePreview] = useState("");

  /* ── Detail viewer ── */
  const [viewEntry, setViewEntry] = useState<InvoiceBookEntryDto | null>(null);

  /* ── Delete confirmation ── */
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ── Next serial number (auto-generated) ── */
  const nextSerialNumber = entries.length > 0
    ? Math.max(...entries.map((e) => e.serialNumber ?? 0)) + 1
    : 1;

  /* ── Load entries ── */
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoiceBookService.list(projectName);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  /* ── Toast auto-clear ── */
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  /* ── Form helpers ── */
  function handleChange(key: keyof InvoiceBookEntryDto, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openAddForm() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setEntryMode("MANUAL");
    setImagePreview("");
    setShowForm(true);
    setError("");
  }

  function openEditForm(entry: InvoiceBookEntryDto) {
    setEditId(entry.id ?? null);
    setForm({
      serialNumber: entry.serialNumber,
      invoiceNo: entry.invoiceNo || "",
      supplierContractorName: entry.supplierContractorName || "",
      invoiceDate: entry.invoiceDate || toISODate(new Date()),
      invoiceValue: entry.invoiceValue || 0,
      materialWorkDetails: entry.materialWorkDetails || "",
      invoiceNarration: entry.invoiceNarration || "",
      updatedInTally: entry.updatedInTally || false,
      entryMode: entry.entryMode || "MANUAL",
      invoiceImageBase64: entry.invoiceImageBase64 || "",
    });
    setEntryMode((entry.entryMode as "MANUAL" | "IMAGE") || "MANUAL");
    setImagePreview(entry.invoiceImageBase64 || "");
    setShowForm(true);
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setEntryMode("MANUAL");
    setImagePreview("");
    setError("");
  }

  /* ── Image capture ── */
  const handleImageCapture = useCallback(async (base64: string) => {
    setImagePreview(base64);
    setForm((prev) => ({ ...prev, invoiceImageBase64: base64, entryMode: "IMAGE" }));

    // Auto-extract fields from image
    setExtracting(true);
    try {
      const extracted = await invoiceBookService.extractImage(base64);
      const hasExtractedData = !!(extracted.invoiceNo || extracted.supplierContractorName ||
        (extracted.invoiceValue && extracted.invoiceValue > 0) || extracted.materialWorkDetails);

      setForm((prev) => ({
        ...prev,
        invoiceNo: extracted.invoiceNo || prev.invoiceNo || "",
        supplierContractorName: extracted.supplierContractorName || prev.supplierContractorName || "",
        invoiceDate: extracted.invoiceDate || prev.invoiceDate || toISODate(new Date()),
        invoiceValue: extracted.invoiceValue || prev.invoiceValue || 0,
        materialWorkDetails: extracted.materialWorkDetails || prev.materialWorkDetails || "",
        invoiceNarration: extracted.invoiceNarration || prev.invoiceNarration || "",
        invoiceImageBase64: base64,
        entryMode: "IMAGE",
      }));

      if (hasExtractedData) {
        setSuccess("Invoice details extracted from image. Please review and save.");
      } else {
        setSuccess("Invoice image attached. Please fill in the details manually.");
      }
    } catch {
      setError("Could not auto-extract invoice details. Please fill in manually.");
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleImageClear = useCallback(() => {
    setImagePreview("");
    setForm((prev) => ({ ...prev, invoiceImageBase64: "" }));
  }, []);

  /* ── Save ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.invoiceNo || !form.supplierContractorName || !form.invoiceValue) {
      setError("Please fill all required fields: Invoice No, Supplier/Contractor Name, Invoice Value");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const dto: InvoiceBookEntryDto = {
        ...form,
        projectName,
        entryMode: entryMode,
        invoiceImageBase64: imagePreview || undefined,
      };
      if (editId) {
        await invoiceBookService.update(editId, dto);
        setSuccess("Invoice entry updated successfully!");
      } else {
        await invoiceBookService.create(dto);
        setSuccess("Invoice entry created successfully!");
      }
      cancelForm();
      loadEntries();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save invoice entry");
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete() {
    if (!deleteId) return;
    try {
      await invoiceBookService.delete(deleteId);
      setSuccess("Invoice entry deleted.");
      setDeleteId(null);
      loadEntries();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete entry");
      setDeleteId(null);
    }
  }

  /* ── Toggle Tally ── */
  async function toggleTally(entry: InvoiceBookEntryDto) {
    try {
      await invoiceBookService.update(entry.id!, {
        ...entry,
        updatedInTally: !entry.updatedInTally,
      });
      loadEntries();
    } catch {
      setError("Failed to update Tally status");
    }
  }

  /* ── Export Excel ── */
  async function handleExportExcel() {
    try {
      const blob = await invoiceBookService.exportExcel(projectName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-book-${projectName.replace(/\s+/g, "-")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export Excel file");
    }
  }

  /* ── Total value ── */
  const totalValue = entries.reduce((sum, e) => sum + (e.invoiceValue || 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Invoice & Payment Entry</h2>
          <p className="text-sm text-gray-500 mt-1">{projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          {downloadEnabled && (
            <button
              onClick={handleExportExcel}
              disabled={entries.length === 0}
              className="px-4 py-2 text-sm border border-green-600 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 transition"
            >
              Export Excel
            </button>
          )}
          {activeTab === "invoiceEntry" && !showForm && (
            <button
              onClick={openAddForm}
              className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 transition font-medium"
            >
              + ADD ENTRY
            </button>
          )}
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("invoiceEntry")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "invoiceEntry"
              ? "border-arcadia-600 text-arcadia-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Invoice Entry
        </button>
        <button
          onClick={() => setActiveTab("paymentEntry")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "paymentEntry"
              ? "border-arcadia-600 text-arcadia-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Payment Entry
        </button>
      </div>

      {/* Toast Messages */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* ═══ INVOICE ENTRY TAB ═══ */}
      {activeTab === "invoiceEntry" && (
        <>
          {/* ── Entry Form ── */}
          {showForm && (
            <div className="mb-6 bg-white rounded-xl shadow-sm border p-6">
              <div className="pb-3 border-b mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editId ? "Edit Invoice Entry" : "New Invoice Entry"}
                </h3>
              </div>

              {/* Entry Mode Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Entry Mode</label>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setEntryMode("MANUAL")}
                    className={`px-5 py-2 text-sm font-medium rounded-md transition ${
                      entryMode === "MANUAL"
                        ? "bg-white text-arcadia-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode("IMAGE")}
                    className={`px-5 py-2 text-sm font-medium rounded-md transition ${
                      entryMode === "IMAGE"
                        ? "bg-white text-arcadia-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Image
                  </button>
                </div>
              </div>

              {/* Image Capture (shown in IMAGE mode) */}
              {entryMode === "IMAGE" && (
                <div className="mb-4">
                  <InvoiceImageCapture
                    imagePreview={imagePreview}
                    onCapture={handleImageCapture}
                    onClear={handleImageClear}
                  />
                  {extracting && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-arcadia-600">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Extracting invoice details from image...
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* S.No (auto-generated, read-only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      S.No <span className="text-xs text-gray-400 ml-1">(Auto generated)</span>
                    </label>
                    <input
                      type="text"
                      value={editId != null ? form.serialNumber ?? "" : nextSerialNumber}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Invoice No & Supplier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.invoiceNo || ""}
                      onChange={(e) => handleChange("invoiceNo", e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="Enter invoice number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier / Contractor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.supplierContractorName || ""}
                      onChange={(e) => handleChange("supplierContractorName", e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="Enter supplier or contractor name"
                    />
                  </div>
                </div>

                {/* Date & Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={form.invoiceDate || ""}
                      onChange={(e) => handleChange("invoiceDate", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Value (Rs) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.invoiceValue || ""}
                      onChange={(e) => handleChange("invoiceValue", Number(e.target.value))}
                      required
                      min={0}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="Enter invoice value"
                    />
                  </div>
                </div>

                {/* Material/Work Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material / Work Details
                  </label>
                  <input
                    type="text"
                    value={form.materialWorkDetails || ""}
                    onChange={(e) => handleChange("materialWorkDetails", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Describe the material or work"
                  />
                </div>

                {/* Invoice Narration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Narration
                  </label>
                  <textarea
                    value={form.invoiceNarration || ""}
                    onChange={(e) => handleChange("invoiceNarration", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Additional notes or narration"
                  />
                </div>

                {/* Updated in Tally */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Updated in Tally</label>
                  <button
                    type="button"
                    onClick={() => handleChange("updatedInTally", !form.updatedInTally)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.updatedInTally ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.updatedInTally ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-500">{form.updatedInTally ? "Yes" : "No"}</span>
                </div>

                {/* Image preview in manual mode if image was previously attached */}
                {entryMode === "MANUAL" && imagePreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attached Image</label>
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Invoice" className="max-h-32 rounded-lg border shadow-sm" />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving || extracting}
                    className="flex-1 py-2.5 bg-arcadia-600 text-white rounded-lg font-medium hover:bg-arcadia-700 disabled:opacity-50 transition"
                  >
                    {saving ? "Saving..." : editId ? "Update Entry" : "Save Entry"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Summary Card ── */}
          {entries.length > 0 && (
            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                <p className="text-xs text-gray-400 uppercase">Total Entries</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{entries.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                <p className="text-xs text-gray-400 uppercase">Total Value</p>
                <p className="text-xl font-bold text-arcadia-700 mt-1">{formatCurrency(totalValue)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                <p className="text-xs text-gray-400 uppercase">Tally Updated</p>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {entries.filter((e) => e.updatedInTally).length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                <p className="text-xs text-gray-400 uppercase">Tally Pending</p>
                <p className="text-xl font-bold text-yellow-600 mt-1">
                  {entries.filter((e) => !e.updatedInTally).length}
                </p>
              </div>
            </div>
          )}

          {/* ── Entries Table ── */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-arcadia-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-400 text-lg">No invoice entries yet.</p>
              <p className="text-gray-400 text-sm mt-1">Click "+ ADD ENTRY" to create your first entry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">S.No</th>
                    <th className="px-3 py-2 text-left">Invoice No</th>
                    <th className="px-3 py-2 text-left">Supplier / Contractor</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Material / Work</th>
                    <th className="px-3 py-2 text-right">Value</th>
                    <th className="px-3 py-2 text-left max-w-[150px]">Narration</th>
                    <th className="px-3 py-2 text-center">Tally</th>
                    <th className="px-3 py-2 text-center">Mode</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`border-t hover:bg-gray-50 cursor-pointer ${
                        idx % 2 === 1 ? "bg-gray-50/50" : ""
                      }`}
                      onClick={() => setViewEntry(entry)}
                    >
                      <td className="px-3 py-2 text-gray-500">{entry.serialNumber ?? idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-arcadia-700">{entry.invoiceNo || "---"}</td>
                      <td className="px-3 py-2">{entry.supplierContractorName || "---"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {entry.invoiceDate ? formatDate(entry.invoiceDate) : "---"}
                      </td>
                      <td className="px-3 py-2 max-w-[150px] truncate">{entry.materialWorkDetails || "---"}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {entry.invoiceValue ? formatCurrency(entry.invoiceValue) : "---"}
                      </td>
                      <td className="px-3 py-2 max-w-[150px] truncate text-gray-600">
                        {entry.invoiceNarration || "---"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTally(entry); }}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium transition ${
                            entry.updatedInTally
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {entry.updatedInTally ? "Yes" : "No"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.entryMode === "IMAGE"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {entry.entryMode === "IMAGE" ? "Image" : "Manual"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditForm(entry); }}
                            className="px-2 py-1 text-xs text-arcadia-600 hover:bg-arcadia-50 rounded transition"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(entry.id!); }}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td className="px-3 py-2" colSpan={5}>
                      Total ({entries.length} entries)
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(totalValue)}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {/* ═══ PAYMENT ENTRY TAB ═══ */}
      {activeTab === "paymentEntry" && (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-5xl mb-4 opacity-60">&#128679;</div>
          <h3 className="text-xl font-semibold text-gray-700">Payment Entry</h3>
          <p className="text-gray-400 mt-2">Coming Soon</p>
          <p className="text-gray-400 text-sm mt-1">
            The Payment Entry feature is under development and will be available shortly.
          </p>
        </div>
      )}

      {/* ═══ DETAIL VIEWER MODAL ═══ */}
      {viewEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setViewEntry(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Invoice Details</h3>
              <button
                onClick={() => setViewEntry(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">S.No</p>
                  <p className="text-sm font-medium">{viewEntry.serialNumber || "---"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Invoice No</p>
                  <p className="text-sm font-medium">{viewEntry.invoiceNo || "---"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">Supplier / Contractor</p>
                <p className="text-sm font-medium">{viewEntry.supplierContractorName || "---"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Invoice Date</p>
                  <p className="text-sm font-medium">
                    {viewEntry.invoiceDate ? formatDate(viewEntry.invoiceDate) : "---"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Invoice Value</p>
                  <p className="text-sm font-medium text-arcadia-700">
                    {viewEntry.invoiceValue ? formatCurrency(viewEntry.invoiceValue) : "---"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">Material / Work Details</p>
                <p className="text-sm">{viewEntry.materialWorkDetails || "---"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">Invoice Narration</p>
                <p className="text-sm">{viewEntry.invoiceNarration || "---"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Updated in Tally</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      viewEntry.updatedInTally
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {viewEntry.updatedInTally ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Entry Mode</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      viewEntry.entryMode === "IMAGE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {viewEntry.entryMode === "IMAGE" ? "Image" : "Manual"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Created By</p>
                  <p className="text-sm">{viewEntry.createdBy || "---"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Created At</p>
                  <p className="text-sm">
                    {viewEntry.createdAt ? formatDate(viewEntry.createdAt) : "---"}
                  </p>
                </div>
              </div>

              {/* Invoice Image */}
              {viewEntry.invoiceImageBase64 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Invoice Image</p>
                  <img
                    src={viewEntry.invoiceImageBase64}
                    alt="Invoice"
                    className="max-h-64 rounded-lg border shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setViewEntry(null); openEditForm(viewEntry); }}
                className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 transition"
              >
                Edit
              </button>
              <button
                onClick={() => setViewEntry(null)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Delete Invoice Entry</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this invoice entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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
