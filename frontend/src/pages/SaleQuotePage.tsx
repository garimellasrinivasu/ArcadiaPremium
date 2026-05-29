import { useEffect, useState, useRef } from "react";
import { saleQuoteService } from "../services/saleQuoteService";
import type { SaleQuoteDto, CreateSaleQuoteRequest } from "../services/saleQuoteService";

type Tab = "calculator" | "saved";
type FilterPeriod = "today" | "week" | "month" | "year" | "custom" | "all";

function formatCurrency(val?: number | null): string {
  if (val == null) return "—";
  return "₹ " + val.toLocaleString("en-IN");
}

function getDateRange(period: FilterPeriod): { from: string; to: string } | null {
  const today = new Date();
  const toStr = (d: Date) => d.toISOString().split("T")[0];
  switch (period) {
    case "today":
      return { from: toStr(today), to: toStr(today) };
    case "week": {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return { from: toStr(weekAgo), to: toStr(today) };
    }
    case "month": {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return { from: toStr(monthAgo), to: toStr(today) };
    }
    case "year": {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      return { from: toStr(yearAgo), to: toStr(today) };
    }
    default:
      return null;
  }
}

export default function SaleQuotePage() {
  const [tab, setTab] = useState<Tab>("calculator");
  const [quotes, setQuotes] = useState<SaleQuoteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for save messages from the iframe calculator
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === "SAVE_SALE_QUOTE") {
        const data = event.data.payload as CreateSaleQuoteRequest;
        saleQuoteService.create(data).then(() => {
          alert("Quote saved successfully!");
          if (tab === "saved") loadQuotes();
        }).catch((err) => alert("Failed to save quote.\n" + (err.message || err)));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [tab]);

  useEffect(() => {
    if (tab === "saved") loadQuotes();
  }, [tab, filterPeriod, customFrom, customTo]);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      let data: SaleQuoteDto[];
      if (filterPeriod === "all" && !searchQuery) {
        data = await saleQuoteService.getAll();
      } else {
        let from: string | undefined;
        let to: string | undefined;
        if (filterPeriod === "custom") {
          from = customFrom || undefined;
          to = customTo || undefined;
        } else if (filterPeriod !== "all") {
          const range = getDateRange(filterPeriod);
          if (range) { from = range.from; to = range.to; }
        }
        if (!searchQuery && from && to) {
          data = await saleQuoteService.getByDateRange(from, to);
        } else {
          data = await saleQuoteService.search(searchQuery || undefined, from, to);
        }
      }
      setQuotes(data);
    } catch (err) {
      console.error("Failed to load quotes:", err);
      setQuotes([]);
    }
    setLoading(false);
  };

  const handleSearch = () => loadQuotes();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this quote permanently?")) return;
    await saleQuoteService.delete(id);
    loadQuotes();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setTab("calculator")}
          className={`px-5 py-3 text-sm font-semibold transition ${
            tab === "calculator"
              ? "border-b-2 border-blue-600 text-blue-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Calculator
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`px-5 py-3 text-sm font-semibold transition ${
            tab === "saved"
              ? "border-b-2 border-blue-600 text-blue-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Saved Quotes
        </button>
      </div>

      {/* Calculator Tab */}
      {tab === "calculator" && (
        <div className="flex-1 -mx-4 md:-mx-8">
          <iframe
            ref={iframeRef}
            src="/sale-sheet.html"
            title="Sale Quote Calculator"
            className="w-full border-none"
            style={{ height: "calc(100vh - 180px)" }}
          />
        </div>
      )}

      {/* Saved Quotes Tab */}
      {tab === "saved" && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex flex-wrap items-end gap-3">
              {/* Period buttons */}
              <div className="flex flex-wrap gap-1">
                {(["today", "week", "month", "year", "all", "custom"] as FilterPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      filterPeriod === p
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : p === "year" ? "This Year" : p === "all" ? "All" : "Custom"}
                  </button>
                ))}
              </div>

              {/* Custom date range */}
              {filterPeriod === "custom" && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </>
              )}

              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by name, phone, or plot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                Search
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-500">{quotes.length} quote{quotes.length !== 1 ? "s" : ""} found</p>
          </div>

          {/* Quotes table */}
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No quotes found for the selected period.
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Summary row */}
                  <div
                    className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-sm font-bold text-gray-800">{q.customerName}</p>
                      <p className="text-xs text-gray-400">{q.customerPhone || "—"}</p>
                    </div>
                    <div className="w-20">
                      <p className="text-xs text-gray-400">Plot</p>
                      <p className="text-sm font-semibold text-gray-700">{q.plotNo || "—"}</p>
                    </div>
                    <div className="w-24">
                      <p className="text-xs text-gray-400">Area</p>
                      <p className="text-sm font-semibold text-gray-700">{q.plotAreaSqYards} Sq.Yd</p>
                    </div>
                    <div className="w-20">
                      <p className="text-xs text-gray-400">Plan</p>
                      <p className="text-sm font-semibold text-gray-700">{q.pricingOption}</p>
                    </div>
                    <div className="w-32 text-right">
                      <p className="text-xs text-gray-400">Grand Total</p>
                      <p className="text-sm font-bold text-green-700">{formatCurrency(q.grandTotal)}</p>
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-sm text-gray-600">{q.quoteDate}</p>
                    </div>
                    <span className={`text-xs font-bold transition-transform ${expandedId === q.id ? "rotate-90" : ""}`}>
                      &#9654;
                    </span>
                  </div>

                  {/* Expanded details */}
                  {expandedId === q.id && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-400 text-xs">Construction Sft</span>
                          <p className="font-semibold">{q.totalConstructionSft?.toLocaleString("en-IN")}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Rate/Sft</span>
                          <p className="font-semibold">{formatCurrency(q.ratePerSft)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Sale Value</span>
                          <p className="font-semibold">{formatCurrency(q.saleValue)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Additional Charges</span>
                          <p className="font-semibold">{formatCurrency(q.additionalChargesTotal)}</p>
                        </div>
                        {q.clubHouseCharges ? (
                          <div>
                            <span className="text-gray-400 text-xs">Club House</span>
                            <p className="font-semibold">{formatCurrency(q.clubHouseCharges)}</p>
                          </div>
                        ) : null}
                        {q.corpusFund ? (
                          <div>
                            <span className="text-gray-400 text-xs">Corpus Fund</span>
                            <p className="font-semibold">{formatCurrency(q.corpusFund)}</p>
                          </div>
                        ) : null}
                        {q.legalCharges ? (
                          <div>
                            <span className="text-gray-400 text-xs">Legal Charges</span>
                            <p className="font-semibold">{formatCurrency(q.legalCharges)}</p>
                          </div>
                        ) : null}
                        {q.cautionDeposit ? (
                          <div>
                            <span className="text-gray-400 text-xs">Caution Deposit</span>
                            <p className="font-semibold">{formatCurrency(q.cautionDeposit)}</p>
                          </div>
                        ) : null}
                        {q.advanceMaintenance ? (
                          <div>
                            <span className="text-gray-400 text-xs">Advance Maintenance</span>
                            <p className="font-semibold">{formatCurrency(q.advanceMaintenance)}</p>
                          </div>
                        ) : null}
                        {q.plcTotal ? (
                          <div>
                            <span className="text-gray-400 text-xs">PLC Total</span>
                            <p className="font-semibold">{formatCurrency(q.plcTotal)}</p>
                          </div>
                        ) : null}
                        {q.splitOtpPercent ? (
                          <div>
                            <span className="text-gray-400 text-xs">Split OTP</span>
                            <p className="font-semibold">{q.splitOtpPercent}% @ {formatCurrency(q.splitOtpRate)}/sft</p>
                          </div>
                        ) : null}
                        {q.splitGeneralPercent ? (
                          <div>
                            <span className="text-gray-400 text-xs">Split General</span>
                            <p className="font-semibold">{q.splitGeneralPercent}% @ {formatCurrency(q.splitGeneralRate)}/sft</p>
                          </div>
                        ) : null}
                        <div>
                          <span className="text-gray-400 text-xs">Created By</span>
                          <p className="font-semibold">{q.createdBy || "—"}</p>
                        </div>
                        {q.salesPerson && (
                          <div>
                            <span className="text-gray-400 text-xs">Sales Person</span>
                            <p className="font-semibold">{q.salesPerson}</p>
                          </div>
                        )}
                      </div>
                      {q.amountInWords && (
                        <p className="text-xs italic text-gray-500 mb-3">In Words: {q.amountInWords}</p>
                      )}
                      {q.notes && (
                        <p className="text-xs text-gray-500 mb-3">Notes: {q.notes}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
