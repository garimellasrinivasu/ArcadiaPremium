import { useState, useMemo, useRef } from "react";

/* ─── Helpers ─── */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export default function CapitolFundPage() {
  const DEFAULT_SFT_PRICE = 7000;
  const DEFAULT_INTEREST_RATE = 1.50;

  // Customer details
  const [customerName, setCustomerName] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [customerMobile, setCustomerMobile] = useState<string>("");

  // Calculator inputs
  const [inputAmount, setInputAmount] = useState<string>("");
  const [interestRate, setInterestRate] = useState<string>(DEFAULT_INTEREST_RATE.toString());
  const [interestType, setInterestType] = useState<"compound" | "simple">("simple");
  const [compoundFrequency, setCompoundFrequency] = useState<"monthly" | "quarterly" | "halfyearly">("monthly");
  const [periodMonths, setPeriodMonths] = useState<string>("12");
  const [sftPrice, setSftPrice] = useState<string>(DEFAULT_SFT_PRICE.toString());

  const printRef = useRef<HTMLDivElement>(null);

  /* ─── Compounding interval ─── */
  const compoundIntervalMonths = compoundFrequency === "monthly" ? 1
    : compoundFrequency === "quarterly" ? 3 : 6;

  const compoundLabel = compoundFrequency === "monthly" ? "Monthly"
    : compoundFrequency === "quarterly" ? "Quarterly" : "Half-Yearly";

  /* ─── Calculations ─── */
  const calculations = useMemo(() => {
    const principal = parseFloat(inputAmount) || 0;
    const rate = parseFloat(interestRate) || 0;
    const months = parseInt(periodMonths) || 0;
    const sft = parseFloat(sftPrice) || 0;

    if (principal <= 0 || rate <= 0 || months <= 0 || sft <= 0) return null;

    const monthlyRate = rate / 100;
    let totalAmount: number;
    let totalInterest: number;
    let monthlyInterest: number;

    if (interestType === "simple") {
      totalInterest = principal * monthlyRate * months;
      totalAmount = principal + totalInterest;
      monthlyInterest = principal * monthlyRate;
    } else {
      const intervalMonths = compoundIntervalMonths;
      const periodRate = monthlyRate * intervalMonths;
      const periods = months / intervalMonths;
      totalAmount = principal * Math.pow(1 + periodRate, periods);
      totalInterest = totalAmount - principal;
      monthlyInterest = principal * monthlyRate;
    }

    return {
      principal, totalAmount, totalInterest, monthlyInterest,
      allocatedSft: principal / sft,
      equivalentSft: totalAmount / sft,
      months, sft,
    };
  }, [inputAmount, interestRate, interestType, periodMonths, sftPrice, compoundIntervalMonths]);

  /* ─── Breakdown ─── */
  const breakdown = useMemo(() => {
    if (!calculations) return [];
    const { principal, months } = calculations;
    const monthlyRate = (parseFloat(interestRate) || 0) / 100;
    const intervalMonths = compoundIntervalMonths;
    const rows: { month: number; openingBalance: number; interest: number; compounded: boolean; closingBalance: number }[] = [];

    let balance = principal;
    let accumulatedInterest = 0;

    for (let m = 1; m <= months; m++) {
      if (interestType === "simple") {
        const interest = principal * monthlyRate;
        const closing = balance + interest;
        rows.push({ month: m, openingBalance: balance, interest, compounded: false, closingBalance: closing });
        balance = closing;
      } else {
        const interest = balance * monthlyRate;
        accumulatedInterest += interest;
        const isCompoundMonth = m % intervalMonths === 0;
        if (isCompoundMonth) {
          const closing = balance + accumulatedInterest;
          rows.push({ month: m, openingBalance: balance, interest: accumulatedInterest, compounded: true, closingBalance: closing });
          balance = closing;
          accumulatedInterest = 0;
        } else {
          rows.push({ month: m, openingBalance: balance, interest, compounded: false, closingBalance: balance + accumulatedInterest });
        }
      }
    }
    return rows;
  }, [calculations, interestRate, interestType, compoundIntervalMonths]);

  /* ─── Print ─── */
  function handlePrint() {
    if (!calculations || !printRef.current) return;
    const docTitle = `Arcadiapremium_${customerName ? customerName.replace(/\s+/g, "") : "Customer"}_CapitalCalculations`;

    // Inject print-only styles
    let styleEl = document.getElementById("capitol-print-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "capitol-print-styles";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @media print {
        /* Hide everything except the print content */
        body > *:not(#capitol-print-overlay) { display: none !important; }
        #capitol-print-overlay { display: block !important; }

        @page { size: A4 portrait; margin: 6mm 8mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 7pt; color: #111; line-height: 1.25; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-page { padding: 0; }
        .p-header { text-align: center; padding: 1.5mm 0 2mm; border-bottom: 1pt double #c9a961; margin-bottom: 2mm; }
        .p-logo { max-width: 40mm; height: auto; margin: 0 auto 0.5mm; display: block; }
        .p-developer { font-size: 6pt; letter-spacing: 2pt; color: #a68845; text-transform: uppercase; font-weight: 700; }
        .p-tagline { font-family: Georgia, serif; font-style: italic; font-size: 6pt; color: #6b7280; margin-top: 0.3mm; }
        .p-title { text-align: center; margin: 1.5mm 0; }
        .p-title .label { display: inline-block; background: #0a2540; color: #fff; padding: 1pt 10pt; font-size: 8pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; }
        .p-title .date { font-size: 6pt; color: #6b7280; margin-top: 1mm; }
        .p-info { background: #fdf9ef; border-left: 2pt solid #c9a961; padding: 1.5mm 2.5mm; margin: 2mm 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1mm 3mm; }
        .p-info .cell .k { text-transform: uppercase; font-size: 5pt; color: #6b7280; letter-spacing: 0.5pt; font-weight: 700; }
        .p-info .cell .v { color: #0a2540; font-size: 7pt; font-weight: 700; margin-top: 0.2mm; }
        .p-section { margin-top: 2mm; margin-bottom: 0.5mm; padding: 0.8mm 2.5mm; background: linear-gradient(to right, #0a2540, #133963); color: #fff; font-size: 6pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase; }
        .p-sft-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2mm; margin: 2mm 0; }
        .p-sft-box { border: 0.5pt solid #e3e7ef; padding: 1.5mm 2mm; text-align: center; border-radius: 1mm; }
        .p-sft-box.highlight { background: #0a2540; color: #fff; border-color: #0a2540; }
        .p-sft-box .lbl { font-size: 5.5pt; text-transform: uppercase; letter-spacing: 0.5pt; font-weight: 700; color: #6b7280; }
        .p-sft-box.highlight .lbl { color: #c9a961; }
        .p-sft-box .val { font-size: 9pt; font-weight: 800; margin-top: 0.3mm; }
        .p-sft-box.highlight .val { color: #c9a961; }
        .p-sft-box .sub { font-size: 5pt; color: #999; margin-top: 0.2mm; }
        .p-sft-box.highlight .sub { color: #94a3b8; }
        .p-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5mm; margin: 2mm 0; }
        .p-card { border: 0.5pt solid #e3e7ef; padding: 1.5mm; text-align: center; border-radius: 1mm; }
        .p-card .lbl { font-size: 5pt; text-transform: uppercase; letter-spacing: 0.4pt; font-weight: 700; color: #6b7280; }
        .p-card .val { font-size: 8pt; font-weight: 800; color: #0a2540; margin-top: 0.2mm; }
        .p-card.total { background: #0a2540; border-color: #0a2540; }
        .p-card.total .lbl { color: #c9a961; }
        .p-card.total .val { color: #c9a961; }
        .p-table { width: 100%; border-collapse: collapse; margin-top: 0.5mm; }
        .p-table th { background: #f4f6fa; font-size: 5.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3pt; padding: 0.8mm 1.5mm; border-bottom: 0.5pt solid #0a2540; color: #0a2540; }
        .p-table td { padding: 0.5mm 1.5mm; font-size: 6pt; border-bottom: 0.2pt solid #e3e7ef; }
        .p-table td.r { text-align: right; font-variant-numeric: tabular-nums; }
        .p-table th.r { text-align: right; }
        .p-table th.c { text-align: center; }
        .p-table td.c { text-align: center; }
        .p-table tr.compound { background: #f0fdf4; }
        .p-table tr.compound td { font-weight: 600; }
        .p-table tfoot td { font-weight: 800; font-size: 6.5pt; border-top: 0.75pt solid #0a2540; background: #fdf9ef; padding: 0.8mm 1.5mm; }
        .p-footer { margin-top: 2mm; border-top: 0.5pt solid #c9a961; padding-top: 1mm; text-align: center; font-size: 5.5pt; color: #6b7280; }
        .p-footer strong { color: #0a2540; }
      }
    `;

    // Create overlay with print content
    let overlay = document.getElementById("capitol-print-overlay");
    if (overlay) overlay.remove();
    overlay = document.createElement("div");
    overlay.id = "capitol-print-overlay";
    overlay.style.display = "none";
    overlay.innerHTML = printRef.current.innerHTML;
    document.body.appendChild(overlay);

    // Change title for PDF filename
    const originalTitle = document.title;
    document.title = docTitle;

    // Trigger print
    setTimeout(() => {
      window.print();
      // Restore after print
      document.title = originalTitle;
      overlay?.remove();
    }, 200);
  }

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const periodLabel = parseInt(periodMonths) >= 12
    ? `${Math.floor(parseInt(periodMonths) / 12)} year${Math.floor(parseInt(periodMonths) / 12) > 1 ? "s" : ""}${parseInt(periodMonths) % 12 > 0 ? ` ${parseInt(periodMonths) % 12} mo` : ""}`
    : `${periodMonths} month${parseInt(periodMonths) !== 1 ? "s" : ""}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-arcadia-800">Capital Fund Calculator</h1>
        {calculations && (
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition shadow-sm">
            <span className="text-base">&#128424;</span>
            Print / Save as PDF
          </button>
        )}
      </div>

      {/* ── Customer Details ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Customer Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input type="text" value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input type="tel" value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              placeholder="Enter mobile number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500" />
          </div>
        </div>
      </div>

      {/* ── Calculator Inputs ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Investment Calculator</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount (Rs)</label>
            <input type="number" min="0" step="1000" value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per month)</label>
            <input type="number" min="0" step="0.01" value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500" />
            <p className="text-[10px] text-gray-400 mt-0.5">Default: {DEFAULT_INTEREST_RATE}% (Rs 1.50 per Rs 100)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Type</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button onClick={() => setInterestType("compound")}
                className={`flex-1 py-2.5 text-sm font-medium transition ${interestType === "compound" ? "bg-arcadia-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                Compound
              </button>
              <button onClick={() => setInterestType("simple")}
                className={`flex-1 py-2.5 text-sm font-medium transition border-l border-gray-300 ${interestType === "simple" ? "bg-arcadia-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                Simple
              </button>
            </div>
          </div>

          {interestType === "compound" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compounding Frequency</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button onClick={() => setCompoundFrequency("monthly")}
                  className={`flex-1 py-2.5 text-sm font-medium transition ${compoundFrequency === "monthly" ? "bg-arcadia-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  Monthly
                </button>
                <button onClick={() => setCompoundFrequency("quarterly")}
                  className={`flex-1 py-2.5 text-sm font-medium transition border-l border-gray-300 ${compoundFrequency === "quarterly" ? "bg-arcadia-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  Quarterly
                </button>
                <button onClick={() => setCompoundFrequency("halfyearly")}
                  className={`flex-1 py-2.5 text-sm font-medium transition border-l border-gray-300 ${compoundFrequency === "halfyearly" ? "bg-arcadia-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  Half-Yearly
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Interest added to principal every {compoundIntervalMonths} month{compoundIntervalMonths > 1 ? "s" : ""}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current SFT Price (Rs)</label>
            <input type="number" min="0" step="100" value={sftPrice}
              onChange={(e) => setSftPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500" />
            <p className="text-[10px] text-gray-400 mt-0.5">Base price: Rs 7,000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Period (Months)</label>
            <input type="number" min="1" max="360" step="1" value={periodMonths}
              onChange={(e) => setPeriodMonths(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500" />
            <p className="text-[10px] text-gray-400 mt-0.5">{periodLabel}</p>
          </div>
        </div>
      </div>

      {/* ── SFT Summary Row ── */}
      {calculations && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Current SFT Price</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(calculations.sft)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Per Square Foot</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 text-center">
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">Allocated SFT (Principal)</p>
            <p className="text-xl font-bold text-blue-700">{formatNumber(calculations.allocatedSft, 4)}</p>
            <p className="text-[10px] text-gray-400 mt-1">{formatCurrency(calculations.principal)} / {formatCurrency(calculations.sft)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-sm p-5 text-center">
            <p className="text-xs font-medium text-green-100 uppercase tracking-wider mb-1">Equivalent SFT (Total Amount)</p>
            <p className="text-xl font-bold text-white">{formatNumber(calculations.equivalentSft, 4)}</p>
            <p className="text-[10px] text-green-200 mt-1">{formatCurrency(calculations.totalAmount)} / {formatCurrency(calculations.sft)}</p>
          </div>
        </div>
      )}

      {/* ── Results Summary ── */}
      {calculations && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Principal Amount</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(calculations.principal)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              {interestType === "compound" ? "First Month" : "Monthly"} Interest
            </p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(calculations.monthlyInterest)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Interest Earned</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(calculations.totalInterest)}</p>
          </div>
          <div className="bg-gradient-to-br from-arcadia-600 to-arcadia-700 rounded-xl shadow-sm p-5 text-center">
            <p className="text-xs font-medium text-arcadia-100 uppercase tracking-wider mb-1">Total Amount</p>
            <p className="text-xl font-bold text-white">{formatCurrency(calculations.totalAmount)}</p>
            <p className="text-[10px] text-arcadia-200 mt-1">
              Principal + {interestType === "compound" ? `Compound (${compoundLabel})` : "Simple"} Interest ({calculations.months} months)
            </p>
          </div>
        </div>
      )}

      {/* ── Month-by-Month Breakdown ── */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Month-by-Month Breakdown ({interestType === "compound" ? `Compound — ${compoundLabel}` : "Simple"} Interest)
            </h2>
            <span className="text-xs text-gray-400">{breakdown.length} months</span>
          </div>
          <div className="overflow-auto max-h-[50vh] always-scroll">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Month</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Opening Balance</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Interest</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr key={row.month} className={`border-b hover:bg-gray-50 ${row.compounded ? "bg-green-50" : ""}`}>
                    <td className="px-4 py-2.5 text-center text-gray-600 font-medium">
                      {row.month}
                      {row.compounded && (
                        <span className="ml-1.5 text-[9px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">C</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{formatCurrency(row.openingBalance)}</td>
                    <td className="px-4 py-2.5 text-right text-green-600 font-medium">
                      {formatCurrency(row.interest)}
                      {row.compounded && interestType === "compound" && compoundFrequency !== "monthly" && (
                        <span className="block text-[9px] text-green-500">compounded</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-800 font-semibold">{formatCurrency(row.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-arcadia-50 border-t-2 border-arcadia-200">
                <tr>
                  <td className="px-4 py-3 text-center font-bold text-arcadia-800">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(calculations!.principal)}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(calculations!.totalInterest)}</td>
                  <td className="px-4 py-3 text-right font-bold text-arcadia-800">{formatCurrency(calculations!.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!calculations && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="text-5xl text-gray-300 mb-3">&#128176;</div>
          <p className="text-gray-500">Enter an investment amount to see calculations.</p>
          <p className="text-sm text-gray-400 mt-1">Adjust interest rate, type, SFT price, and period as needed.</p>
        </div>
      )}

      {/* ═══ Hidden Print Content ═══ */}
      {calculations && (
        <div ref={printRef} style={{ display: "none" }}>
          <div className="print-page">
            {/* Header with Arcadia Logo */}
            <div className="p-header">
              <img src="/arcadia-logo.png" alt="Arcadia Premium" className="p-logo" />
              <div className="p-developer">Praneeth Group</div>
              <div className="p-tagline">Premium Living, Redefined</div>
            </div>

            {/* Title */}
            <div className="p-title">
              <div className="label">Capital Fund - Investment Summary</div>
              <div className="date">Generated on {todayStr}</div>
            </div>

            {/* Customer Info */}
            {(customerName || customerAddress || customerMobile) && (
              <div className="p-info" style={{ gridTemplateColumns: "1fr 1.5fr 1fr" }}>
                <div className="cell">
                  <div className="k">Customer Name</div>
                  <div className="v">{customerName || "—"}</div>
                </div>
                <div className="cell">
                  <div className="k">Address</div>
                  <div className="v">{customerAddress || "—"}</div>
                </div>
                <div className="cell">
                  <div className="k">Mobile Number</div>
                  <div className="v">{customerMobile || "—"}</div>
                </div>
              </div>
            )}

            {/* Investment Info */}
            <div className="p-info">
              <div className="cell">
                <div className="k">Investment Amount</div>
                <div className="v">{formatCurrency(calculations.principal)}</div>
              </div>
              <div className="cell">
                <div className="k">Interest Rate</div>
                <div className="v">{interestRate}% / month</div>
              </div>
              <div className="cell">
                <div className="k">Interest Type</div>
                <div className="v">{interestType === "compound" ? `Compound (${compoundLabel})` : "Simple Interest"}</div>
              </div>
              <div className="cell">
                <div className="k">Calculation Period</div>
                <div className="v">{periodLabel}</div>
              </div>
              <div className="cell">
                <div className="k">Total Interest Earned</div>
                <div className="v">{formatCurrency(calculations.totalInterest)}</div>
              </div>
              <div className="cell">
                <div className="k">Total Amount</div>
                <div className="v" style={{ color: "#16a34a" }}>{formatCurrency(calculations.totalAmount)}</div>
              </div>
            </div>

            {/* SFT Summary */}
            <div className="p-section">SFT Allocation</div>
            <div className="p-sft-row">
              <div className="p-sft-box">
                <div className="lbl">Current SFT Price</div>
                <div className="val">{formatCurrency(calculations.sft)}</div>
                <div className="sub">Per Square Foot</div>
              </div>
              <div className="p-sft-box">
                <div className="lbl">Allocated SFT (Principal)</div>
                <div className="val" style={{ color: "#1d4ed8" }}>{formatNumber(calculations.allocatedSft, 4)}</div>
                <div className="sub">{formatCurrency(calculations.principal)} / {formatCurrency(calculations.sft)}</div>
              </div>
              <div className="p-sft-box highlight">
                <div className="lbl">Equivalent SFT (Total)</div>
                <div className="val">{formatNumber(calculations.equivalentSft, 4)}</div>
                <div className="sub">{formatCurrency(calculations.totalAmount)} / {formatCurrency(calculations.sft)}</div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-section">Financial Summary</div>
            <div className="p-summary">
              <div className="p-card">
                <div className="lbl">Principal</div>
                <div className="val">{formatCurrency(calculations.principal)}</div>
              </div>
              <div className="p-card">
                <div className="lbl">{interestType === "compound" ? "1st Month" : "Monthly"} Interest</div>
                <div className="val">{formatCurrency(calculations.monthlyInterest)}</div>
              </div>
              <div className="p-card">
                <div className="lbl">Total Interest</div>
                <div className="val" style={{ color: "#16a34a" }}>{formatCurrency(calculations.totalInterest)}</div>
              </div>
              <div className="p-card total">
                <div className="lbl">Total Amount</div>
                <div className="val">{formatCurrency(calculations.totalAmount)}</div>
              </div>
            </div>

            {/* Month-by-Month Table */}
            <div className="p-section">Month-by-Month Breakdown</div>
            <table className="p-table">
              <thead>
                <tr>
                  <th className="c">Month</th>
                  <th className="r">Opening Balance</th>
                  <th className="r">Interest</th>
                  <th className="r">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr key={row.month} className={row.compounded ? "compound" : ""}>
                    <td className="c">{row.month}{row.compounded ? " *" : ""}</td>
                    <td className="r">{formatCurrency(row.openingBalance)}</td>
                    <td className="r">{formatCurrency(row.interest)}</td>
                    <td className="r">{formatCurrency(row.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="c">Total</td>
                  <td className="r">{formatCurrency(calculations.principal)}</td>
                  <td className="r">{formatCurrency(calculations.totalInterest)}</td>
                  <td className="r">{formatCurrency(calculations.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
            {interestType === "compound" && compoundFrequency !== "monthly" && (
              <div style={{ fontSize: "6.5pt", color: "#6b7280", marginTop: "1mm" }}>
                * Rows marked with asterisk indicate compounding months where interest is added to principal.
              </div>
            )}

            {/* Footer */}
            <div className="p-footer">
              <strong>Praneeth Arcadia Premium</strong> &nbsp;|&nbsp; Capital Fund Investment Summary
              &nbsp;|&nbsp; This is a system-generated document for reference purposes only.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
