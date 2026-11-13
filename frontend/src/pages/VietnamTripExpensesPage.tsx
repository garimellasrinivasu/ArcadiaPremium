import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { authService } from "../services/authService";
import { formatDate } from "../utils/date";

interface Expense {
  id: number; expenseDate: string; paidBy: string; description: string; category: string;
  amount: number; currency: string; rateToInr: number; amountInr: number; sharedWith: string;
  createdBy?: string;
}
interface Draft {
  id?: number; expenseDate: string; paidBy: string; description: string; category: string;
  amount: string; currency: string; rateToInr: string; sharedWith: string[];
}
interface Transfer { from: string; to: string; amount: number }

const CATEGORIES: [string, string][] = [
  ["FOOD", "🍜 Food"], ["STAY", "🏨 Stay"], ["TRAVEL", "🚕 Travel"],
  ["SIGHTSEEING", "🏞️ Sightseeing"], ["SHOPPING", "🛍️ Shopping"], ["OTHER", "📌 Other"],
];
const catLabel = (c: string) => CATEGORIES.find(([k]) => k === c)?.[1] || c;
const DEFAULT_RATE: Record<string, string> = { INR: "1", VND: "0.0033", USD: "88" };
const inr = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN");
const money = (v: number, cur: string) =>
  cur === "INR" ? inr(v) : `${cur} ${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// The phone's own date, so an entry made late at night in Vietnam gets that day's date
const today = () => new Date().toLocaleDateString("en-CA");
const errOf = (e: any) => e?.response?.data?.error || e?.message || "Something went wrong";
const split = (s: string) => s.split("|").filter(Boolean);

/** Each friend's paid amount, share and balance, in paise so the totals always add up exactly. */
function balancesOf(friends: string[], expenses: Expense[]) {
  const paid: Record<string, number> = {}, share: Record<string, number> = {};
  friends.forEach((f) => { paid[f] = 0; share[f] = 0; });
  for (const e of expenses) {
    const total = Math.round(e.amountInr * 100);
    const people = split(e.sharedWith).filter((p) => p in share);
    if (!people.length || !(e.paidBy in paid)) continue;
    paid[e.paidBy] += total;
    const each = Math.floor(total / people.length);
    let left = total - each * people.length; // spread the odd paise over the first few people
    people.forEach((p) => { share[p] += each + (left > 0 ? 1 : 0); if (left > 0) left--; });
  }
  return friends.map((f) => ({ name: f, paid: paid[f] / 100, share: share[f] / 100, balance: (paid[f] - share[f]) / 100 }));
}

/** Fewest transfers: the friend who owes most pays the friend who is owed most, until everyone is level. */
function settle(balances: { name: string; balance: number }[]): Transfer[] {
  const owe = balances.filter((b) => b.balance < -0.5).map((b) => ({ name: b.name, amt: Math.round(-b.balance) }));
  const get = balances.filter((b) => b.balance > 0.5).map((b) => ({ name: b.name, amt: Math.round(b.balance) }));
  const out: Transfer[] = [];
  while (owe.length && get.length) {
    owe.sort((a, b) => b.amt - a.amt); get.sort((a, b) => b.amt - a.amt);
    const o = owe[0], g = get[0], amt = Math.min(o.amt, g.amt);
    if (amt > 0) out.push({ from: o.name, to: g.name, amount: amt });
    o.amt -= amt; g.amt -= amt;
    if (o.amt <= 0) owe.shift();
    if (g.amt <= 0) get.shift();
  }
  return out;
}

export default function VietnamTripExpensesPage() {
  const [friends, setFriends] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [filter, setFilter] = useState("");

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      setCanEdit(u.role?.name === "ADMIN" || (u.allowedPages || []).includes("VIETNAM_TRIP"));
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = (await api.get<{ friends: string[]; expenses: Expense[] }>("/trip-expenses")).data;
      setFriends(r.friends); setExpenses(r.expenses);
    } catch (e) { setError(errOf(e)); }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const balances = useMemo(() => balancesOf(friends, expenses), [friends, expenses]);
  const transfers = useMemo(() => settle(balances), [balances]);
  const total = expenses.reduce((s, e) => s + e.amountInr, 0);
  const shown = filter ? expenses.filter((e) => e.paidBy === filter || split(e.sharedWith).includes(filter)) : expenses;

  /** Rate last used for a currency, so the form doesn't need it typed every time */
  const lastRate = (cur: string) => String(expenses.find((e) => e.currency === cur)?.rateToInr ?? DEFAULT_RATE[cur]);

  const openNew = () => setDraft({
    expenseDate: today(), paidBy: "", description: "", category: "FOOD",
    amount: "", currency: "VND", rateToInr: lastRate("VND"), sharedWith: [...friends],
  });
  const openEdit = (e: Expense) => setDraft({
    id: e.id, expenseDate: e.expenseDate, paidBy: e.paidBy, description: e.description, category: e.category || "OTHER",
    amount: String(e.amount), currency: e.currency, rateToInr: String(e.rateToInr), sharedWith: split(e.sharedWith),
  });

  const save = async () => {
    if (!draft) return;
    setSaving(true); setError("");
    try {
      const body = { ...draft, amount: Number(draft.amount), rateToInr: Number(draft.rateToInr) };
      if (draft.id) await api.put(`/trip-expenses/${draft.id}`, body);
      else await api.post("/trip-expenses", body);
      setDraft(null); flash(draft.id ? "Expense updated" : "Expense logged");
      await load();
    } catch (e) { setError(errOf(e)); }
    setSaving(false);
  };

  const remove = async (e: Expense) => {
    if (!confirm(`Delete "${e.description}" (${money(e.amount, e.currency)}) paid by ${e.paidBy}?`)) return;
    try { await api.delete(`/trip-expenses/${e.id}`); flash("Expense deleted"); await load(); }
    catch (err) { setError(errOf(err)); }
  };

  const summaryText = useMemo(() => {
    const lines = [
      "🇻🇳 *Vietnam Trip – Settlement*",
      `Total spent: ${inr(total)} (${expenses.length} entries)`,
      "",
      "*Who pays whom*",
      ...(transfers.length ? transfers.map((t, i) => `${i + 1}. ${t.from} → ${t.to}: ${inr(t.amount)}`) : ["Everyone is settled 🎉"]),
      "",
      "*Paid / Share / Balance*",
      ...balances.map((b) => `${b.name}: paid ${inr(b.paid)}, share ${inr(b.share)}, ${b.balance >= 0.5 ? "gets " + inr(b.balance) : b.balance <= -0.5 ? "pays " + inr(-b.balance) : "settled"}`),
    ];
    return lines.join("\n");
  }, [transfers, balances, total, expenses.length]);

  const copySummary = async () => {
    try { await navigator.clipboard.writeText(summaryText); flash("Summary copied"); }
    catch { flash("Could not copy — select the text and copy it"); }
  };

  const d = draft;
  const draftInr = d ? (Number(d.amount) || 0) * (d.currency === "INR" ? 1 : Number(d.rateToInr) || 0) : 0;
  const perHead = d && d.sharedWith.length ? draftInr / d.sharedWith.length : 0;

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mr-auto">🇻🇳 Vietnam Trip Expenses</h1>
        {canEdit && <button onClick={openNew} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">+ Log Expense</button>}
        <button onClick={() => setShowSettlement(true)} disabled={!expenses.length}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">⚖️ Settlement</button>
      </div>

      {toast && <div className="p-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">{toast}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between gap-2"><span>{error}</span><button onClick={() => setError("")}>&times;</button></div>}

      <div className="grid grid-cols-3 gap-2">
        {[["Total spent", inr(total)], ["Entries", expenses.length], ["Per person (avg)", inr(friends.length ? total / friends.length : 0)]].map(([l, v]) => (
          <div key={l as string} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-800">{v}</div><div className="text-xs text-gray-500">{l}</div>
          </div>
        ))}
      </div>

      {/* Per-friend summary */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">Summary by friend</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr><th className="text-left px-3 py-2">Friend</th><th className="text-right px-3 py-2">Paid</th><th className="text-right px-3 py-2">Share</th><th className="text-right px-3 py-2">Balance</th></tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.name} className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${filter === b.name ? "bg-blue-50" : ""}`}
                  onClick={() => setFilter(filter === b.name ? "" : b.name)} title="Click to see this friend's entries">
                  <td className="px-3 py-2 font-medium text-gray-800">{b.name}</td>
                  <td className="px-3 py-2 text-right">{inr(b.paid)}</td>
                  <td className="px-3 py-2 text-right">{inr(b.share)}</td>
                  <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${b.balance >= 0.5 ? "text-green-700" : b.balance <= -0.5 ? "text-red-600" : "text-gray-500"}`}>
                    {b.balance >= 0.5 ? `gets ${inr(b.balance)}` : b.balance <= -0.5 ? `pays ${inr(-b.balance)}` : "settled"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense log */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200 flex items-center gap-2">
          <span className="mr-auto">Expense log{filter && <> — <span className="text-blue-700">{filter}</span></>}</span>
          {filter && <button onClick={() => setFilter("")} className="text-xs text-blue-600 hover:underline">Show all</button>}
        </div>
        {loading && !expenses.length ? <div className="p-4 text-sm text-gray-500">Loading…</div> : !shown.length ? (
          <div className="p-6 text-center text-sm text-gray-400">No expenses logged yet{canEdit ? " — click + Log Expense" : ""}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Paid by</th><th className="text-left px-3 py-2">For</th>
                  <th className="text-right px-3 py-2">Amount</th><th className="text-right px-3 py-2">In ₹</th><th className="text-left px-3 py-2">Shared with</th>
                  {canEdit && <th className="px-3 py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => {
                  const people = split(e.sharedWith);
                  return (
                    <tr key={e.id} className="border-t border-gray-100 align-top">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(e.expenseDate)}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">{e.paidBy}</td>
                      <td className="px-3 py-2"><div>{e.description}</div><div className="text-[11px] text-gray-500">{catLabel(e.category)}</div></td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{money(e.amount, e.currency)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-semibold">{inr(e.amountInr)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {people.length === friends.length ? "All" : people.join(", ")}
                        <div className="text-[11px] text-gray-400">{inr(e.amountInr / (people.length || 1))} each</div>
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <button onClick={() => openEdit(e)} className="text-xs text-blue-600 hover:underline mr-2">Edit</button>
                          <button onClick={() => void remove(e)} className="text-xs text-red-600 hover:underline">Delete</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log / edit form */}
      {d && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setDraft(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center"><h2 className="text-lg font-bold text-gray-800 mr-auto">{d.id ? "Edit expense" : "Log expense"}</h2>
              <button onClick={() => setDraft(null)} className="text-2xl leading-none text-gray-400">&times;</button></div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">Date
                <input type="date" value={d.expenseDate} onChange={(e) => setDraft({ ...d, expenseDate: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
              </label>
              <label className="text-xs text-gray-600">Paid by
                <select value={d.paidBy} onChange={(e) => setDraft({ ...d, paidBy: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white">
                  <option value="">— Choose —</option>{friends.map((f) => <option key={f}>{f}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-xs text-gray-600">What was it for
              <input value={d.description} maxLength={200} placeholder="e.g. Dinner at Ben Thanh, Ha Long Bay cruise"
                onChange={(e) => setDraft({ ...d, description: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
            </label>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(([k, l]) => (
                <button key={k} type="button" onClick={() => setDraft({ ...d, category: k })}
                  className={`px-2.5 py-1 text-xs rounded-full border ${d.category === k ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}>{l}</button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-2 text-xs text-gray-600">Amount
                <input type="number" inputMode="decimal" min="0" value={d.amount} onChange={(e) => setDraft({ ...d, amount: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
              </label>
              <label className="text-xs text-gray-600">Currency
                <select value={d.currency} onChange={(e) => setDraft({ ...d, currency: e.target.value, rateToInr: lastRate(e.target.value) })} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white">
                  <option value="VND">VND ₫</option><option value="INR">INR ₹</option><option value="USD">USD $</option>
                </select>
              </label>
            </div>
            {d.currency !== "INR" && (
              <label className="block text-xs text-gray-600">Rate: ₹ for 1 {d.currency}
                <input type="number" inputMode="decimal" min="0" step="any" value={d.rateToInr} onChange={(e) => setDraft({ ...d, rateToInr: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
                {d.currency === "VND" && Number(d.rateToInr) > 0 && <span className="text-[11px] text-gray-400">≈ {Math.round(1 / Number(d.rateToInr)).toLocaleString("en-IN")} VND per ₹1</span>}
              </label>
            )}

            <div>
              <div className="flex items-center text-xs text-gray-600 mb-1">
                <span className="mr-auto">Shared with ({d.sharedWith.length})</span>
                <button type="button" onClick={() => setDraft({ ...d, sharedWith: [...friends] })} className="text-blue-600 hover:underline mr-3">All</button>
                <button type="button" onClick={() => setDraft({ ...d, sharedWith: [] })} className="text-blue-600 hover:underline">None</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {friends.map((f) => {
                  const on = d.sharedWith.includes(f);
                  return (
                    <label key={f} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-sm cursor-pointer ${on ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}>
                      <input type="checkbox" checked={on} onChange={() => setDraft({ ...d, sharedWith: on ? d.sharedWith.filter((x) => x !== f) : friends.filter((x) => x === f || d.sharedWith.includes(x)) })} />
                      {f}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="text-sm bg-gray-50 rounded-lg p-2 text-gray-700">
              = <b>{inr(draftInr)}</b>{d.sharedWith.length > 0 && <> · <b>{inr(perHead)}</b> each for {d.sharedWith.length}</>}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setDraft(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300">Cancel</button>
              <button onClick={() => void save()} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement */}
      {showSettlement && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowSettlement(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center"><h2 className="text-lg font-bold text-gray-800 mr-auto">⚖️ Settlement</h2>
              <button onClick={() => setShowSettlement(false)} className="text-2xl leading-none text-gray-400">&times;</button></div>
            <p className="text-xs text-gray-500">Total spent {inr(total)}. The fewest transfers that make everyone even:</p>
            {transfers.length ? (
              <ol className="space-y-2">
                {transfers.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="font-semibold text-red-600">{t.from}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-green-700 mr-auto">{t.to}</span>
                    <span className="font-bold text-gray-800">{inr(t.amount)}</span>
                  </li>
                ))}
              </ol>
            ) : <div className="p-4 text-center text-sm text-gray-500">Everyone is settled 🎉</div>}
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer text-blue-600">Summary text to share</summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded-lg whitespace-pre-wrap font-sans">{summaryText}</pre>
            </details>
            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={() => void copySummary()} className="px-4 py-2 text-sm rounded-lg border border-gray-300">📋 Copy summary</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(summaryText)}`} target="_blank" rel="noreferrer"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#25D366] text-white hover:opacity-90">Share on WhatsApp</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
