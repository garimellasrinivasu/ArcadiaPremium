import { useEffect, useState, useRef, useCallback } from "react";
import { authService } from "../services/authService";
import { partnerInvestmentService } from "../services/partnerInvestmentService";
import type { PartnerInvestmentDto, CreatePartnerInvestmentRequest } from "../services/partnerInvestmentService";
import type { User } from "../types/user";
import api from "../services/api";

/* ═══════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════ */
const ALL_PARTNERS = ["Prakash N", "Suresh Kumar K", "Srinivasu Garimella"];
const PROJECTS = ["Praneeth Arcadia Premium", "Praneeth Redfern Square", "Aalaya Arvindham", "Kalpavruksha Developers"];
const PAYMENT_MODES = ["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"];
const PURPOSES = ["LAND", "CONSTRUCTION", "MATERIAL", "LABOUR", "LEGAL", "REGISTRATION", "OTHER"];

/** Project-specific partner mapping (must match backend) */
const PROJECT_PARTNERS: Record<string, string[]> = {
  "Kalpavruksha Developers": ["Prakash N", "Srinivasu Garimella"],
};
function getProjectPartners(projectName: string): string[] {
  return PROJECT_PARTNERS[projectName] || ALL_PARTNERS;
}

interface Project { id: number; name: string; }

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function toISODate(d: Date) { return d.toISOString().slice(0, 10); }

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

function approvalDots(entry: PartnerInvestmentDto) {
  const projectPartners = getProjectPartners(entry.projectName);
  const approvals = [
    { name: ALL_PARTNERS[0], approved: entry.partner1Approved },
    { name: ALL_PARTNERS[1], approved: entry.partner2Approved },
    { name: ALL_PARTNERS[2], approved: entry.partner3Approved },
  ].filter(p => projectPartners.some(pp => pp.toLowerCase() === p.name.toLowerCase()));
  return (
    <div className="flex gap-1">
      {approvals.map((a, i) => (
        <span key={i} className={`w-3 h-3 rounded-full ${a.approved ? "bg-green-500" : "bg-gray-300"}`} title={`${a.name}: ${a.approved ? "Approved" : "Pending"}`} />
      ))}
    </div>
  );
}

/** Flexible matching: check if createdByName corresponds to a given partner */
function isCreatorPartner(createdByName: string | undefined, partnerName: string): boolean {
  if (!createdByName) return false;
  const lower = createdByName.toLowerCase().trim();
  const pLower = partnerName.toLowerCase();
  if (lower === pLower) return true;
  // Partial match
  if (pLower.includes("prakash") && lower.includes("prakash")) return true;
  if (pLower.includes("suresh") && lower.includes("suresh")) return true;
  if (pLower.includes("garimella") && (lower.includes("garimella") || lower.includes("srinivas"))) return true;
  if (pLower.includes("srinivasu") && (lower.includes("garimella") || lower.includes("srinivas"))) return true;
  return false;
}

/** Get per-partner approval status text for display */
function getApprovalLines(entry: PartnerInvestmentDto): { name: string; status: string; isCreator: boolean; inProject: boolean }[] {
  const projectPartners = getProjectPartners(entry.projectName);
  return [
    { name: ALL_PARTNERS[0], approved: entry.partner1Approved, approvedAt: entry.partner1ApprovedAt },
    { name: ALL_PARTNERS[1], approved: entry.partner2Approved, approvedAt: entry.partner2ApprovedAt },
    { name: ALL_PARTNERS[2], approved: entry.partner3Approved, approvedAt: entry.partner3ApprovedAt },
  ].map(p => {
    const inProject = projectPartners.some(pp => pp.toLowerCase() === p.name.toLowerCase());
    const isCreator = isCreatorPartner(entry.createdByName, p.name);
    let status = "Pending";
    if (!inProject) {
      status = "N/A";
    } else if (p.approved && isCreator) {
      status = "Auto-approved (Creator)";
    } else if (p.approved) {
      status = p.approvedAt ? `Approved on ${formatDate(p.approvedAt)}` : "Approved";
    }
    return { name: p.name, status, isCreator, inProject };
  });
}

/* ═══════════════════════════════════════════
   SIGNATURE PAD COMPONENT
   ═══════════════════════════════════════════ */
function SignaturePad({ onSave, onCancel }: { onSave: (sig: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [hasDrawn, setHasDrawn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function getCtx() { return canvasRef.current?.getContext("2d"); }

  function getPos(e: React.TouchEvent | React.MouseEvent): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
    }
    return [(e as React.MouseEvent).clientX - rect.left, (e as React.MouseEvent).clientY - rect.top];
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    setDrawing(true);
    setHasDrawn(true);
    const [x, y] = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const [x, y] = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDraw() { setDrawing(false); }

  function clearCanvas() {
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  }

  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function saveDrawn() {
    if (!canvasRef.current) return;
    onSave(canvasRef.current.toDataURL("image/png"));
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onSave(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border p-5 w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-3">Add Your Signature</h3>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMode("draw")} className={`px-3 py-1.5 text-xs rounded-lg border ${mode === "draw" ? "bg-arcadia-600 text-white" : "text-gray-600"}`}>Draw Signature</button>
        <button onClick={() => setMode("upload")} className={`px-3 py-1.5 text-xs rounded-lg border ${mode === "upload" ? "bg-arcadia-600 text-white" : "text-gray-600"}`}>Upload Image</button>
      </div>

      {mode === "draw" ? (
        <>
          <div className="border-2 border-dashed border-gray-300 rounded-lg mb-3 touch-none">
            <canvas
              ref={canvasRef}
              width={380}
              height={150}
              className="w-full cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={clearCanvas} className="px-3 py-1.5 text-xs border rounded-lg text-gray-600 hover:bg-gray-100">Clear</button>
            <button onClick={saveDrawn} disabled={!hasDrawn} className="px-4 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Save Signature</button>
            <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-3">
            <button onClick={() => fileRef.current?.click()} className="px-4 py-2 text-sm border border-arcadia-300 text-arcadia-700 rounded-lg hover:bg-arcadia-50">
              Choose Signature Image
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </div>
          <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PRINTABLE DOCUMENT COMPONENT
   ═══════════════════════════════════════════ */
function PrintableDocument({ entry, onClose }: { entry: PartnerInvestmentDto; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Investment Agreement - ${entry.projectName}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm 10mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #111827;
          font-size: 10pt;
          line-height: 1.4;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ── Header ── */
        .p-header {
          text-align: center;
          padding-bottom: 4mm;
          border-bottom: 0.75pt double #c9a961;
          margin-bottom: 4mm;
        }
        .p-logo { max-width: 42mm; height: auto; margin: 0 auto 1mm; display: block; }
        .p-developer {
          font-size: 7pt; letter-spacing: 2pt; color: #a68845;
          text-transform: uppercase; font-weight: 700; margin-top: 0.5mm;
        }
        .p-tagline {
          font-family: Georgia, serif; font-style: italic;
          font-size: 7.5pt; color: #6b7280; margin-top: 0.5mm;
        }

        /* ── Title Bar ── */
        .p-title-bar {
          text-align: center; margin: 3mm 0;
        }
        .p-title-bar .label {
          display: inline-block; background: #0a2540; color: #fff;
          padding: 1.5pt 14pt; font-size: 10pt; font-weight: 700;
          letter-spacing: 2pt; text-transform: uppercase;
        }
        .p-title-bar .ref {
          font-size: 8pt; color: #6b7280; margin-top: 1.5mm; letter-spacing: 0.4pt;
        }

        /* ── Info Grid ── */
        .p-info-grid {
          background: #fdf9ef; border-left: 2.5pt solid #c9a961;
          padding: 3mm 4mm; margin: 3mm 0;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 2mm 6mm;
        }
        .p-info-grid .cell .k {
          text-transform: uppercase; font-size: 6.5pt; color: #6b7280;
          letter-spacing: 0.6pt; font-weight: 700;
        }
        .p-info-grid .cell .v {
          color: #0a2540; font-size: 9pt; font-weight: 700; margin-top: 0.3mm;
        }
        .p-info-grid .cell.full { grid-column: 1 / -1; }

        /* ── Amount Box ── */
        .p-amount-box {
          background: linear-gradient(135deg, #0a2540 0%, #061a30 100%);
          color: #fff; padding: 3mm 5mm;
          display: grid; grid-template-columns: 1fr auto; align-items: center;
          gap: 4mm; border: 0.75pt solid #c9a961; margin: 3mm 0;
        }
        .p-amount-box .tl-label {
          font-size: 8pt; letter-spacing: 1.5pt; text-transform: uppercase;
          color: #c9a961; font-weight: 700;
        }
        .p-amount-box .tl-sub { font-size: 7pt; color: #cbd5e1; margin-top: 0.3mm; }
        .p-amount-box .tl-amt {
          font-size: 16pt; font-weight: 800; color: #c9a961;
          font-variant-numeric: tabular-nums;
        }

        /* ── Section Heading ── */
        .p-section-head {
          margin-top: 4mm; margin-bottom: 1mm;
          padding: 1mm 3mm;
          background: linear-gradient(to right, #0a2540, #133963);
          color: #fff; font-size: 8pt; font-weight: 700;
          letter-spacing: 1.5pt; text-transform: uppercase;
        }

        /* ── Table ── */
        .p-table { width: 100%; border-collapse: collapse; }
        .p-table td {
          padding: 1.5mm 3mm; font-size: 9pt;
          border-bottom: 0.3pt solid #e3e7ef; line-height: 1.3;
        }
        .p-table td.lbl { color: #6b7280; font-weight: 600; width: 40%; }
        .p-table td.val { color: #0a2540; font-weight: 600; }

        /* ── Approval Status ── */
        .p-status-row { display: flex; align-items: center; gap: 3mm; margin: 2mm 0 1mm 3mm; }
        .p-badge {
          display: inline-block; padding: 1pt 8pt; border-radius: 10pt;
          font-size: 7.5pt; font-weight: 700;
        }
        .p-badge.approved { background: #d1fae5; color: #065f46; }
        .p-badge.pending { background: #fef3c7; color: #92400e; }

        /* ── Remarks ── */
        .p-remarks {
          background: #fdf9ef; border-left: 2.5pt solid #c9a961;
          padding: 2mm 4mm; margin: 3mm 0;
          font-size: 9pt; color: #1f2937; font-style: italic;
        }
        .p-remarks .rlbl {
          font-style: normal; text-transform: uppercase;
          font-size: 6.5pt; letter-spacing: 1pt; color: #a68845; font-weight: 700;
        }

        /* ── Signatures ── */
        .p-signatures {
          margin-top: 12mm; display: flex; justify-content: space-between;
          gap: 6mm; page-break-inside: avoid;
        }
        .p-sig-block { text-align: center; flex: 1; }
        .p-sig-block img { max-height: 50px; margin-bottom: -45px; display: block; margin-left: auto; margin-right: auto; }
        .p-sig-line {
          border-top: 0.5pt solid #0a2540; margin-top: 50px;
          padding-top: 1.5mm; text-align: center;
        }
        .p-sig-name { font-weight: 700; font-size: 9pt; color: #0a2540; }
        .p-sig-label { font-size: 7pt; color: #6b7280; margin-top: 0.3mm; text-transform: uppercase; letter-spacing: 0.5pt; }

        /* ── Footer ── */
        .p-footer {
          margin-top: 6mm; text-align: center;
          font-size: 7pt; color: #6b7280; letter-spacing: 0.4pt;
          border-top: 0.25pt solid #c9a961; padding-top: 2mm;
        }
        .p-footer strong { color: #0a2540; }

        @media print { .no-print { display: none !important; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  // Build signature data
  const projectPartners = getProjectPartners(entry.projectName);
  const sigData = ALL_PARTNERS.map((name, i) => ({
    name,
    sig: i === 0 ? entry.partner1Signature : i === 1 ? entry.partner2Signature : entry.partner3Signature,
    inProject: projectPartners.some(pp => pp.toLowerCase() === name.toLowerCase()),
    isInvestor: name.toLowerCase() === entry.partnerName.toLowerCase(),
  })).filter(s => s.inProject);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h3 className="font-semibold">Investment Agreement Document</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700">Print / Save PDF</button>
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Close</button>
          </div>
        </div>

        {/* Document */}
        <div ref={printRef} className="p-8" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
          {/* Header */}
          <div className="p-header" style={{ textAlign: "center", paddingBottom: "12px", borderBottom: "2px double #c9a961", marginBottom: "12px" }}>
            <img className="p-logo" src="/arcadia-logo.png" alt="Logo" style={{ maxWidth: "140px", height: "auto", margin: "0 auto 4px", display: "block" }} />
            <div style={{ fontSize: "8px", letterSpacing: "2px", color: "#a68845", textTransform: "uppercase", fontWeight: 700 }}>
              A Venture by Venkata Praneeth Developers Pvt. Ltd.
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "9px", color: "#6b7280", marginTop: "2px" }}>
              Luxury Living &middot; Premium Villas
            </div>
          </div>

          {/* Title Bar */}
          <div style={{ textAlign: "center", margin: "10px 0" }}>
            <span style={{ display: "inline-block", background: "#0a2540", color: "#fff", padding: "3px 16px", fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
              Partner Investment Agreement
            </span>
            <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "4px", letterSpacing: "0.4px" }}>
              Ref: PI-{String(entry.id).padStart(4, "0")} &nbsp;|&nbsp; Date: {formatDate(entry.investmentDate)}
            </div>
          </div>

          {/* Investment Info Grid */}
          <div style={{ background: "#fdf9ef", borderLeft: "3px solid #c9a961", padding: "10px 14px", margin: "10px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
            <div>
              <div style={{ textTransform: "uppercase", fontSize: "7px", color: "#6b7280", letterSpacing: "0.6px", fontWeight: 700 }}>Investing Partner</div>
              <div style={{ color: "#0a2540", fontSize: "11px", fontWeight: 700, marginTop: "1px" }}>{entry.partnerName}</div>
            </div>
            <div>
              <div style={{ textTransform: "uppercase", fontSize: "7px", color: "#6b7280", letterSpacing: "0.6px", fontWeight: 700 }}>Project</div>
              <div style={{ color: "#0a2540", fontSize: "11px", fontWeight: 700, marginTop: "1px" }}>{entry.projectName}</div>
            </div>
            <div>
              <div style={{ textTransform: "uppercase", fontSize: "7px", color: "#6b7280", letterSpacing: "0.6px", fontWeight: 700 }}>Investment Date</div>
              <div style={{ color: "#0a2540", fontSize: "11px", fontWeight: 700, marginTop: "1px" }}>{formatDate(entry.investmentDate)}</div>
            </div>
            <div>
              <div style={{ textTransform: "uppercase", fontSize: "7px", color: "#6b7280", letterSpacing: "0.6px", fontWeight: 700 }}>Purpose</div>
              <div style={{ color: "#0a2540", fontSize: "11px", fontWeight: 700, marginTop: "1px" }}>{entry.purpose || "—"}</div>
            </div>
          </div>

          {/* Amount Box */}
          <div style={{ background: "linear-gradient(135deg, #0a2540 0%, #061a30 100%)", color: "#fff", padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "12px", border: "1px solid #c9a961", margin: "10px 0" }}>
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#c9a961", fontWeight: 700 }}>Investment Amount</div>
              <div style={{ fontSize: "7px", color: "#cbd5e1", marginTop: "1px" }}>{entry.description || "Partner capital contribution"}</div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#c9a961" }}>{formatCurrency(entry.amount)}</div>
          </div>

          {/* Payment Information Section */}
          <div style={{ marginTop: "12px", marginBottom: "2px", padding: "3px 8px", background: "linear-gradient(to right, #0a2540, #133963)", color: "#fff", fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Payment Information
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#6b7280", fontWeight: 600, width: "40%" }}>Payment Mode</td>
                <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#0a2540", fontWeight: 600 }}>{entry.paymentMode.replace("_", " ")}</td>
              </tr>
              {entry.bankName && (
                <tr>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#6b7280", fontWeight: 600 }}>Bank Name</td>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#0a2540", fontWeight: 600 }}>{entry.bankName}</td>
                </tr>
              )}
              {entry.accountDetails && (
                <tr>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#6b7280", fontWeight: 600 }}>Account Details</td>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#0a2540", fontWeight: 600 }}>{entry.accountDetails}</td>
                </tr>
              )}
              {entry.transactionId && (
                <tr>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#6b7280", fontWeight: 600 }}>Transaction ID</td>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#0a2540", fontWeight: 600 }}>{entry.transactionId}</td>
                </tr>
              )}
              {entry.referenceNo && (
                <tr>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#6b7280", fontWeight: 600 }}>Reference No</td>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#0a2540", fontWeight: 600 }}>{entry.referenceNo}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Approval Status Section */}
          <div style={{ marginTop: "12px", marginBottom: "2px", padding: "3px 8px", background: "linear-gradient(to right, #0a2540, #133963)", color: "#fff", fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Approval Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0 4px 8px" }}>
            <span style={{ fontSize: "10px", color: "#374151", fontWeight: 600 }}>Status:</span>
            <span style={{
              display: "inline-block", padding: "2px 10px", borderRadius: "10px",
              fontSize: "9px", fontWeight: 700,
              background: entry.status === "APPROVED" ? "#d1fae5" : "#fef3c7",
              color: entry.status === "APPROVED" ? "#065f46" : "#92400e",
            }}>{entry.status}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {getApprovalLines(entry).filter(l => l.inProject).map(l => (
                <tr key={l.name}>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#6b7280", fontWeight: 600, width: "40%" }}>{l.name}</td>
                  <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "0.5px solid #e3e7ef", color: "#0a2540", fontWeight: 600 }}>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Remarks */}
          {entry.remarks && (
            <div style={{ background: "#fdf9ef", borderLeft: "3px solid #c9a961", padding: "6px 12px", margin: "10px 0", fontSize: "10px", color: "#1f2937", fontStyle: "italic" }}>
              <div style={{ fontStyle: "normal", textTransform: "uppercase", fontSize: "7px", letterSpacing: "1px", color: "#a68845", fontWeight: 700, marginBottom: "2px" }}>Remarks</div>
              {entry.remarks}
            </div>
          )}

          {/* Signature Blocks */}
          <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", gap: "20px", pageBreakInside: "avoid" }}>
            {sigData.map(s => (
              <div key={s.name} style={{ textAlign: "center", flex: 1 }}>
                {s.sig ? <img src={s.sig} alt={`${s.name} signature`} style={{ maxHeight: "50px", marginBottom: "-45px", display: "block", marginLeft: "auto", marginRight: "auto" }} /> : <div style={{ height: "50px" }} />}
                <div style={{ borderTop: "0.5px solid #0a2540", marginTop: "50px", paddingTop: "4px", textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "10px", color: "#0a2540" }}>{s.name}</div>
                  <div style={{ fontSize: "8px", color: "#6b7280", marginTop: "1px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {s.isInvestor ? "Investment Partner" : "Partner"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "8px", color: "#6b7280", letterSpacing: "0.4px", borderTop: "0.5px solid #c9a961", paddingTop: "6px" }}>
            <strong style={{ color: "#0a2540" }}>ArcadiaPremium</strong> &mdash; Partner Investment Management System &middot; Generated on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
type TabKey = "entry" | "submissions" | "pending" | "approved";

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function PartnerInvestmentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("entry");
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
    api.get<Project[]>("/projects").then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "entry", label: "New Entry" },
    { key: "submissions", label: "My Submissions" },
    { key: "pending", label: "Pending Approvals" },
    { key: "approved", label: "Approved" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Partner Investment</h2>
      <div className="flex gap-1 border-b mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === t.key ? "border-arcadia-600 text-arcadia-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "entry" && <EntryTab projects={projects} onSuccess={() => setActiveTab("submissions")} />}
      {activeTab === "submissions" && <SubmissionsTab />}
      {activeTab === "pending" && <PendingTab currentUser={currentUser} />}
      {activeTab === "approved" && <ApprovedTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ENTRY TAB
   ═══════════════════════════════════════════ */
function EntryTab({ projects, onSuccess }: { projects: Project[]; onSuccess: () => void }) {
  const [form, setForm] = useState<CreatePartnerInvestmentRequest>({
    projectName: "",
    partnerName: "",
    investmentDate: toISODate(new Date()),
    amount: 0,
    paymentMode: "",
    referenceNo: "",
    bankName: "",
    accountDetails: "",
    transactionId: "",
    description: "",
    purpose: "",
    receiptImageBase64: "",
    remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Merge project list with fixed PROJECTS
  const allProjects = [...new Set([...PROJECTS, ...projects.map((p) => p.name)])];

  function handleChange(key: string, value: string | number) {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      // When project changes, clear partner if they're not in the new project
      if (key === "projectName") {
        const newPartners = getProjectPartners(value as string);
        if (!newPartners.includes(prev.partnerName)) {
          updated.partnerName = "";
        }
      }
      return updated;
    });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, receiptImageBase64: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectName || !form.partnerName || !form.amount || !form.paymentMode) {
      setError("Please fill all required fields");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await partnerInvestmentService.create(form);
      setSuccess("Investment entry submitted for partner approval!");
      setForm({ projectName: "", partnerName: "", investmentDate: toISODate(new Date()), amount: 0, paymentMode: "", referenceNo: "", bankName: "", accountDetails: "", transactionId: "", description: "", purpose: "", receiptImageBase64: "", remarks: "" });
      setImagePreview("");
      setTimeout(() => { setSuccess(""); onSuccess(); }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl shadow-sm border p-6 space-y-4">
      {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{success}</div>}
      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
          <select value={form.projectName} onChange={(e) => handleChange("projectName", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Project</option>
            {allProjects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Investing Partner <span className="text-red-500">*</span></label>
          <select value={form.partnerName} onChange={(e) => handleChange("partnerName", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Partner</option>
            {getProjectPartners(form.projectName || "").map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
          <input type="date" value={form.investmentDate} onChange={(e) => handleChange("investmentDate", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs) <span className="text-red-500">*</span></label>
          <input type="number" value={form.amount || ""} onChange={(e) => handleChange("amount", Number(e.target.value))} required min={1} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode <span className="text-red-500">*</span></label>
          <select value={form.paymentMode} onChange={(e) => handleChange("paymentMode", e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Mode</option>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
          <select value={form.purpose || ""} onChange={(e) => handleChange("purpose", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Purpose</option>
            {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <input type="text" value={form.bankName || ""} onChange={(e) => handleChange("bankName", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Bank name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Details</label>
          <input type="text" value={form.accountDetails || ""} onChange={(e) => handleChange("accountDetails", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Account number" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
          <input type="text" value={form.transactionId || ""} onChange={(e) => handleChange("transactionId", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Transaction/UTR number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
          <input type="text" value={form.referenceNo || ""} onChange={(e) => handleChange("referenceNo", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cheque / Reference number" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input type="text" value={form.description || ""} onChange={(e) => handleChange("description", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="What is this investment for?" />
      </div>

      {/* Receipt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Receipt</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 text-sm border border-arcadia-300 text-arcadia-700 rounded-lg hover:bg-arcadia-50">Upload Receipt</button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
          {imagePreview && <span className="text-xs text-green-600">Image attached</span>}
        </div>
        {imagePreview && (
          <div className="mt-2 relative inline-block">
            <img src={imagePreview} alt="Receipt" className="max-h-40 rounded-lg border" />
            <button type="button" onClick={() => { setImagePreview(""); setForm((p) => ({ ...p, receiptImageBase64: "" })); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea value={form.remarks || ""} onChange={(e) => handleChange("remarks", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>

      <button type="submit" disabled={saving} className="w-full py-2.5 bg-arcadia-600 text-white rounded-lg font-medium hover:bg-arcadia-700 disabled:opacity-50 transition">
        {saving ? "Submitting..." : "Submit for Partner Approval"}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════
   SUBMISSIONS TAB
   ═══════════════════════════════════════════ */
function SubmissionsTab() {
  const [entries, setEntries] = useState<PartnerInvestmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<PartnerInvestmentDto | null>(null);

  useEffect(() => {
    partnerInvestmentService.mySubmissions().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const viewDocument = useCallback(async (id: number) => {
    try {
      const full = await partnerInvestmentService.getById(id);
      setViewDoc(full);
    } catch { /* ignore */ }
  }, []);

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No submissions yet.</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Project</th>
              <th className="px-3 py-2 text-left">Partner</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-center">Approvals</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{formatDate(e.investmentDate)}</td>
                <td className="px-3 py-2">{e.projectName}</td>
                <td className="px-3 py-2">{e.partnerName}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                <td className="px-3 py-2 text-center">{approvalDots(e)}</td>
                <td className="px-3 py-2 text-center">{statusBadge(e.status)}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => viewDocument(e.id)} className="text-arcadia-600 hover:underline text-xs">View Document</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewDoc && <PrintableDocument entry={viewDoc} onClose={() => setViewDoc(null)} />}
    </>
  );
}

/* ═══════════════════════════════════════════
   PENDING APPROVALS TAB
   ═══════════════════════════════════════════ */
function PendingTab({ currentUser }: { currentUser: User | null }) {
  const [entries, setEntries] = useState<PartnerInvestmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [viewDoc, setViewDoc] = useState<PartnerInvestmentDto | null>(null);

  function refresh() {
    setLoading(true);
    partnerInvestmentService.pending().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  const currentUserName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "";
  const currentUserEmail = currentUser?.email?.toLowerCase() || "";

  // Identify which partner the current user is (matching backend logic)
  function getPartnerIndex(): number {
    if (!currentUser) return -1;
    const lower = currentUserName.toLowerCase().trim();
    const email = currentUserEmail;

    // Exact name match
    for (let i = 0; i < ALL_PARTNERS.length; i++) {
      if (ALL_PARTNERS[i].toLowerCase().trim() === lower) return i;
    }
    // Partial name / email match
    if (lower.includes("prakash") || email.includes("prakash")) return 0;
    if (lower.includes("suresh") || email.includes("suresh")) return 1;
    if (lower.includes("srinivas") || lower.includes("garimella") || email.includes("garimella") || email.includes("srinivas")) return 2;
    return -1;
  }

  function hasAlreadyApproved(entry: PartnerInvestmentDto): boolean {
    const idx = getPartnerIndex();
    if (idx === 0) return !!entry.partner1Approved;
    if (idx === 1) return !!entry.partner2Approved;
    if (idx === 2) return !!entry.partner3Approved;
    return false;
  }

  async function handleApprove(signature: string) {
    if (!signingId) return;
    setProcessing(true);
    try {
      await partnerInvestmentService.approve(signingId, signature);
      setSigningId(null);
      refresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve");
    } finally { setProcessing(false); }
  }

  const viewDocument = useCallback(async (id: number) => {
    try {
      const full = await partnerInvestmentService.getById(id);
      setViewDoc(full);
    } catch { /* ignore */ }
  }, []);

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No pending approvals.</p>;

  const partnerIdx = getPartnerIndex();

  return (
    <>
      <div className="space-y-4">
        {entries.map((e) => {
          const alreadyApproved = hasAlreadyApproved(e);
          return (
            <div key={e.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{e.projectName} &mdash; {formatCurrency(e.amount)}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(e.investmentDate)} &middot; {e.partnerName} &middot; {e.paymentMode.replace("_", " ")}</p>
                  {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
                  {e.purpose && <p className="text-xs text-gray-400 mt-1">Purpose: {e.purpose}</p>}
                </div>
                <div className="text-right">
                  <div className="mb-2">{approvalDots(e)}</div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    {getApprovalLines(e).filter(l => l.inProject).map(l => (
                      <p key={l.name}>{l.name}: <span className={l.status === "Pending" ? "text-yellow-600 font-medium" : "text-green-600"}>{l.status}</span></p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={() => viewDocument(e.id)} className="px-3 py-1.5 text-xs border text-arcadia-600 rounded-lg hover:bg-arcadia-50">View Document</button>
                {partnerIdx >= 0 && !alreadyApproved && (
                  <button onClick={() => setSigningId(e.id)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Sign & Approve
                  </button>
                )}
                {alreadyApproved && (
                  <span className="px-3 py-1.5 text-xs text-green-600 font-medium">You have approved</span>
                )}
                {partnerIdx < 0 && (
                  <span className="px-3 py-1.5 text-xs text-gray-400">Only partners can approve</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Signature Modal */}
      {signingId && !processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <SignaturePad onSave={handleApprove} onCancel={() => setSigningId(null)} />
        </div>
      )}

      {viewDoc && <PrintableDocument entry={viewDoc} onClose={() => setViewDoc(null)} />}
    </>
  );
}

/* ═══════════════════════════════════════════
   APPROVED TAB
   ═══════════════════════════════════════════ */
function ApprovedTab() {
  const [entries, setEntries] = useState<PartnerInvestmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<PartnerInvestmentDto | null>(null);

  useEffect(() => {
    partnerInvestmentService.approved().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const viewDocument = useCallback(async (id: number) => {
    try {
      const full = await partnerInvestmentService.getById(id);
      setViewDoc(full);
    } catch { /* ignore */ }
  }, []);

  if (loading) return <p className="text-gray-400 text-center py-12">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-400 text-center py-12">No approved entries yet.</p>;

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Total Approved Investments</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Total Entries</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{entries.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-400 uppercase">Projects</p>
          <p className="text-2xl font-bold text-arcadia-600 mt-1">{new Set(entries.map((e) => e.projectName)).size}</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Project</th>
              <th className="px-3 py-2 text-left">Partner</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Purpose</th>
              <th className="px-3 py-2 text-center">Document</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{formatDate(e.investmentDate)}</td>
                <td className="px-3 py-2">{e.projectName}</td>
                <td className="px-3 py-2">{e.partnerName}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                <td className="px-3 py-2 text-gray-600">{e.purpose || "—"}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => viewDocument(e.id)} className="text-arcadia-600 hover:underline text-xs">Print / PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-3 py-2" colSpan={3}>Total ({entries.length} entries)</td>
              <td className="px-3 py-2 text-right">{formatCurrency(totalAmount)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {viewDoc && <PrintableDocument entry={viewDoc} onClose={() => setViewDoc(null)} />}
    </>
  );
}
