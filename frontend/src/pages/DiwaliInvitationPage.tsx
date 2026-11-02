import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { authService } from "../services/authService";
import { downloadXlsx, loadSheetJS } from "../utils/sheetjs";

interface Gift {
  id: number;
  festivalYear: number;
  recipientName: string;
  organisation?: string;
  category?: string;
  boxType?: string;
  giftItem?: string;
  quantity?: number;
  address?: string;
  city?: string;
  pincode?: string;
  contactNumber?: string;
  alternateNumber?: string;
  responsiblePerson?: string;
  deliveryMode?: string;
  trackingNumber?: string;
  status: string;
  plannedDate?: string;
  deliveredOn?: string;
  invitationSent?: boolean;
  remarks?: string;
  updatedBy?: string;
  updatedAt?: string;
}
type Draft = Omit<Gift, "id" | "festivalYear" | "updatedBy" | "updatedAt"> & { id?: number };

const STATUSES: Record<string, { label: string; cls: string }> = {
  PLANNED: { label: "Planned", cls: "bg-gray-100 text-gray-700 border-gray-300" },
  PACKED: { label: "Packed", cls: "bg-blue-50 text-blue-700 border-blue-300" },
  DISPATCHED: { label: "Dispatched", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  DELIVERED: { label: "Delivered", cls: "bg-green-100 text-green-800 border-green-300" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-600 border-red-200" },
};
const CATEGORIES: Record<string, string> = {
  CUSTOMER: "Customer", PARTNER: "Partner / Investor", VENDOR: "Vendor / Contractor", OFFICIAL: "Bank / Officials",
  EMPLOYEE: "Employee", FRIENDS_FAMILY: "Friends & Family", OTHER: "Other",
};
const MODES: Record<string, string> = { HAND: "Hand delivery", COURIER: "Courier" };
const BOXES: Record<string, string> = { VIP: "VIP box", GENERAL: "General box" };
const EMPTY: Draft = { recipientName: "", status: "PLANNED", quantity: 1, deliveryMode: "HAND", category: "CUSTOMER", boxType: "GENERAL", invitationSent: false };
const fmt = (d?: string) => d ? new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }) : "";
const errOf = (e: any) => e?.response?.data?.error || e?.message || "Something went wrong";

/** Excel columns (export and import use the same headings). */
const COLUMNS: [keyof Draft, string][] = [
  ["recipientName", "Name"], ["organisation", "Company / Relation"], ["category", "Category"], ["boxType", "Box Type"], ["giftItem", "Gift"], ["quantity", "Qty"],
  ["address", "Address"], ["city", "City"], ["pincode", "Pincode"], ["contactNumber", "Contact Number"], ["alternateNumber", "Alternate Number"],
  ["responsiblePerson", "Responsible for Delivery"], ["deliveryMode", "Delivery Mode"], ["trackingNumber", "Courier / Tracking No"],
  ["plannedDate", "Planned Delivery Date"], ["status", "Status"], ["deliveredOn", "Delivered On"], ["invitationSent", "Invitation Sent"], ["remarks", "Remarks"],
];

export default function DiwaliInvitationPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState<number[]>([]);
  const [rows, setRows] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPerson, setFPerson] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fBox, setFBox] = useState("");
  const [edit, setEdit] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3500); };
  useEffect(() => { loadSheetJS().catch(() => {}); }, []);

  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      const admin = u.role?.name === "ADMIN";
      setCanEdit(admin || (u.allowedPages || []).includes("DIWALI_INVITES"));
    }).catch(() => {});
    api.get<number[]>("/diwali-gifts/years").then((r) => setYears(r.data)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows((await api.get<Gift[]>("/diwali-gifts", { params: { year } })).data); }
    catch (e) { setError(errOf(e)); }
    setLoading(false);
  }, [year]);
  useEffect(() => { void load(); }, [load]);

  const people = useMemo(() => Array.from(new Set(rows.map((r) => r.responsiblePerson).filter(Boolean) as string[])).sort(), [rows]);
  const q = search.trim().toLowerCase();
  const shown = rows.filter((r) =>
    (!fStatus || r.status === fStatus) && (!fPerson || (r.responsiblePerson || "") === fPerson) && (!fCategory || r.category === fCategory) && (!fBox || (r.boxType || "GENERAL") === fBox)
    && (!q || `${r.recipientName} ${r.organisation || ""} ${r.city || ""} ${r.contactNumber || ""} ${r.address || ""} ${r.giftItem || ""}`.toLowerCase().includes(q)));

  const counts = {
    total: rows.filter((r) => r.status !== "CANCELLED").length,
    delivered: rows.filter((r) => r.status === "DELIVERED").length,
    inTransit: rows.filter((r) => r.status === "DISPATCHED" || r.status === "PACKED").length,
    planned: rows.filter((r) => r.status === "PLANNED").length,
    invites: rows.filter((r) => r.invitationSent).length,
    gifts: rows.filter((r) => r.status !== "CANCELLED").reduce((n, r) => n + (r.quantity || 0), 0),
    vip: rows.filter((r) => r.status !== "CANCELLED" && r.boxType === "VIP").reduce((n, r) => n + (r.quantity || 1), 0),
    general: rows.filter((r) => r.status !== "CANCELLED" && r.boxType !== "VIP").reduce((n, r) => n + (r.quantity || 1), 0),
  };
  const byPerson = useMemo(() => {
    const m = new Map<string, { total: number; delivered: number }>();
    rows.filter((r) => r.status !== "CANCELLED").forEach((r) => {
      const k = r.responsiblePerson || "Not assigned";
      const v = m.get(k) || { total: 0, delivered: 0 };
      v.total++; if (r.status === "DELIVERED") v.delivered++;
      m.set(k, v);
    });
    return Array.from(m, ([person, v]) => ({ person, ...v })).sort((a, b) => b.total - a.total);
  }, [rows]);

  const save = async () => {
    if (!edit) return;
    if (!edit.recipientName.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const body = { ...edit, festivalYear: year };
      if (edit.id) await api.put(`/diwali-gifts/${edit.id}`, body); else await api.post("/diwali-gifts", body);
      setEdit(null); flash("Saved"); await load();
    } catch (e) { setError(errOf(e)); }
    setSaving(false);
  };
  const quickStatus = async (g: Gift, status: string) => {
    try {
      const saved = (await api.put<Gift>(`/diwali-gifts/${g.id}`, { status })).data;
      setRows((list) => list.map((r) => (r.id === g.id ? saved : r)));
    } catch (e) { setError(errOf(e)); }
  };
  const remove = async (g: Gift) => {
    if (!window.confirm(`Delete ${g.recipientName}?`)) return;
    try { await api.delete(`/diwali-gifts/${g.id}`); setRows((l) => l.filter((r) => r.id !== g.id)); } catch (e) { setError(errOf(e)); }
  };

  const exportExcel = async () => {
    try {
    if (!shown.length) {
      // Empty list: download a template with every column and one example row to replace
      const example: Record<string, string> = {
        Name: "Example: Mr. Ravi Kumar", "Company / Relation": "ABC Constructions", Category: "Customer", "Box Type": "VIP", Gift: "Dry fruits box", Qty: "1",
        Address: "Flat 101, Green Towers, Road No. 5", City: "Hyderabad", Pincode: "500001", "Contact Number": "9XXXXXXXXX", "Alternate Number": "",
        "Responsible for Delivery": "Ramesh", "Delivery Mode": "Hand delivery", "Courier / Tracking No": "", "Planned Delivery Date": "",
        Status: "Planned", "Delivered On": "", "Invitation Sent": "No", Remarks: "Delete this example row",
      };
      await downloadXlsx(`Deewali Invitation ${year} - template.xlsx`, `Deewali ${year}`, [example]);
      flash("Template downloaded — fill one row per recipient and use Import");
      return;
    }
    await downloadXlsx(`Deewali Invitation ${year}.xlsx`, `Deewali ${year}`, shown.map((r) => Object.fromEntries(COLUMNS.map(([k, h]) => {
      const v = r[k as keyof Gift];
      if (k === "category") return [h, CATEGORIES[r.category || ""] || r.category || ""];
      if (k === "deliveryMode") return [h, MODES[r.deliveryMode || ""] || ""];
      if (k === "boxType") return [h, r.boxType === "VIP" ? "VIP" : "General"];
      if (k === "status") return [h, STATUSES[r.status]?.label || r.status];
      if (k === "invitationSent") return [h, r.invitationSent ? "Yes" : "No"];
      if (k === "plannedDate" || k === "deliveredOn") return [h, v ? String(v).split("-").reverse().join("-") : ""];
      return [h, v ?? ""];
    }))));
    } catch (e) { setError(errOf(e)); }
  };
  const importExcel = async (file: File) => {
    try {
      const XLSX = await loadSheetJS();
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false, dateNF: "dd-mm-yyyy" });
      const byHeader = Object.fromEntries(COLUMNS.map(([k, h]) => [h.toLowerCase(), k]));
      const reverse = (map: Record<string, string>, v: string) => Object.keys(map).find((k) => map[k].toLowerCase() === v.toLowerCase()) || v;
      const data = raw.map((r) => {
        const o: Record<string, unknown> = {};
        Object.entries(r).forEach(([h, v]) => {
          const k = byHeader[h.trim().toLowerCase()]; if (!k) return;
          let val = typeof v === "string" ? v.trim() : v;
          if (k === "category" && val) val = reverse(CATEGORIES, String(val));
          if (k === "deliveryMode" && val) val = reverse(MODES, String(val));
          if (k === "boxType" && val) val = /vip/i.test(String(val)) ? "VIP" : "GENERAL";
          if (k === "status" && val) val = reverse(Object.fromEntries(Object.entries(STATUSES).map(([s, m]) => [s, m.label])), String(val));
          o[k] = val;
        });
        return o;
      }).filter((o) => o.recipientName && !String(o.recipientName).toLowerCase().startsWith("example:"));
      if (!data.length) { setError("No rows found. The sheet needs a 'Name' column (use Export to get the format)."); return; }
      if (!window.confirm(`Import ${data.length} row(s) into Deewali ${year}? Rows with the same name and contact number update the existing entry.`)) return;
      const res = (await api.post("/diwali-gifts/import", { year, rows: data }, { timeout: 60000 })).data;
      flash(`Imported: ${res.created} added, ${res.updated} updated${res.errors?.length ? `, ${res.errors.length} skipped` : ""}`);
      if (res.errors?.length) setError(res.errors.slice(0, 5).join(" · "));
      await load();
    } catch (e) { setError(errOf(e)); }
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setEdit((d) => (d ? { ...d, [k]: v } : d));
  const input = "mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none";

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mr-auto">🪔 Deewali Invitation</h1>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {Array.from(new Set([...years, year, new Date().getFullYear()])).sort((a, b) => b - a).map((y) => <option key={y} value={y}>Deewali {y}</option>)}
        </select>
        <button onClick={() => void exportExcel()} title={rows.length ? "Download the list shown below as Excel" : "Download an Excel template to fill in and import"} className="px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50">{rows.length ? "⬇ Export" : "⬇ Template"}</button>
        {canEdit && (
          <label className="px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer">⬆ Import
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void importExcel(f); }} />
          </label>
        )}
        {canEdit && <button onClick={() => setEdit({ ...EMPTY })} className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700">+ Add recipient</button>}
      </div>

      {toast && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{toast}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between gap-2"><span>{error}</span><button onClick={() => setError("")}>&times;</button></div>}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[["Recipients", counts.total, "text-gray-800"], ["Gifts (qty)", counts.gifts, "text-orange-700"], ["VIP boxes", counts.vip, "text-yellow-700"], ["General boxes", counts.general, "text-sky-700"], ["Delivered", counts.delivered, "text-green-700"],
          ["Packed / Dispatched", counts.inTransit, "text-amber-700"], ["Yet to deliver", counts.planned, "text-gray-700"], ["Invitations sent", counts.invites, "text-purple-700"]].map(([l, v, c]) => (
          <div key={l as string} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${c}`}>{v as number}</div><div className="text-xs text-gray-500">{l as string}</div>
          </div>
        ))}
      </div>
      {byPerson.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center text-xs">
          <span className="font-semibold text-gray-700 mr-1">Delivery by person:</span>
          {byPerson.map((p) => (
            <button key={p.person} onClick={() => setFPerson(fPerson === p.person ? "" : p.person === "Not assigned" ? "" : p.person)}
              className={`px-2.5 py-1 rounded-full border ${fPerson === p.person ? "bg-orange-600 text-white border-orange-600" : "border-gray-300 hover:bg-gray-50"}`}>
              {p.person}: <b>{p.delivered}</b>/{p.total} delivered
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, city, phone, address…"
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm">
          <option value="">All statuses</option>{Object.entries(STATUSES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
        <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm">
          <option value="">All categories</option>{Object.entries(CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={fBox} onChange={(e) => setFBox(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm">
          <option value="">VIP & General</option>{Object.entries(BOXES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={fPerson} onChange={(e) => setFPerson(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm">
          <option value="">All delivery persons</option>{people.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-gray-400">{shown.length} of {rows.length}</span>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        {loading ? <p className="p-8 text-center text-gray-400 text-sm">Loading…</p> : shown.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">{rows.length ? "No entries match the filters." : `No recipients for Deewali ${year} yet.${canEdit ? " Click “+ Add recipient” or Import an Excel list." : ""}`}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-xs text-gray-600"><tr>
              {["#", "Recipient", "Gift", "Address", "Contact", "Delivery by", "Status", ""].map((h) => <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>{shown.map((g, i) => (
              <tr key={g.id} className={`border-t border-gray-100 align-top ${g.status === "CANCELLED" ? "opacity-60" : ""}`}>
                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2 min-w-[160px]">
                  <div className="font-semibold text-gray-800">{g.recipientName}</div>
                  {g.organisation && <div className="text-xs text-gray-500">{g.organisation}</div>}
                  <div className="text-[11px] text-gray-400">{CATEGORIES[g.category || ""] || g.category}{g.invitationSent ? " · 💌 invitation sent" : ""}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`inline-block text-[11px] font-bold rounded px-1.5 py-0.5 mb-1 border ${g.boxType === "VIP" ? "bg-gradient-to-r from-yellow-200 to-amber-300 text-amber-900 border-amber-400" : "bg-sky-50 text-sky-700 border-sky-200"}`}>
                    {g.boxType === "VIP" ? "★ VIP" : "General"}
                  </span>
                  <div>{g.giftItem || "—"}{g.quantity && g.quantity > 1 ? ` × ${g.quantity}` : ""}</div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700 min-w-[200px] whitespace-pre-line">{[g.address, [g.city, g.pincode].filter(Boolean).join(" - ")].filter(Boolean).join("\n") || "—"}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {g.contactNumber ? <a href={`tel:${g.contactNumber}`} className="text-blue-600 hover:underline">{g.contactNumber}</a> : "—"}
                  {g.alternateNumber && <div className="text-gray-500">{g.alternateNumber}</div>}
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  <div className="font-medium text-gray-800">{g.responsiblePerson || <span className="text-gray-400">Not assigned</span>}</div>
                  <div className="text-gray-500">{MODES[g.deliveryMode || ""] || ""}{g.trackingNumber ? ` · ${g.trackingNumber}` : ""}</div>
                  {g.plannedDate && <div className="text-gray-500">By {fmt(g.plannedDate)}</div>}
                </td>
                <td className="px-3 py-2 text-xs">
                  {canEdit ? (
                    <select value={g.status} onChange={(e) => void quickStatus(g, e.target.value)} className={`border rounded px-1.5 py-1 font-medium ${STATUSES[g.status]?.cls}`}>
                      {Object.entries(STATUSES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                    </select>
                  ) : <span className={`border rounded px-1.5 py-0.5 ${STATUSES[g.status]?.cls}`}>{STATUSES[g.status]?.label}</span>}
                  {g.deliveredOn && <div className="text-gray-500 mt-1">{fmt(g.deliveredOn)}</div>}
                  {g.remarks && <div className="text-gray-400 italic mt-1 max-w-[160px]">{g.remarks}</div>}
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {canEdit && <>
                    <button onClick={() => setEdit({ ...g })} className="text-blue-600 hover:underline mr-2">Edit</button>
                    <button onClick={() => void remove(g)} className="text-red-500 hover:underline">Delete</button>
                  </>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {/* Add / edit */}
      {edit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setEdit(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-orange-700">{edit.id ? "Edit recipient" : "Add recipient"} — Deewali {year}</h2>
              <button onClick={() => setEdit(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
              <label>Name *<input className={input} value={edit.recipientName} onChange={(e) => set("recipientName", e.target.value)} placeholder="Recipient name" /></label>
              <label>Company / Relation<input className={input} value={edit.organisation || ""} onChange={(e) => set("organisation", e.target.value)} /></label>
              <label>Category
                <select className={input} value={edit.category || ""} onChange={(e) => set("category", e.target.value)}>
                  {Object.entries(CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
              <div className="sm:col-span-2">
                <span>Box type</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(["VIP", "GENERAL"] as const).map((b) => (
                    <button key={b} type="button" onClick={() => set("boxType", b)}
                      className={`py-2.5 rounded-lg border text-sm font-semibold transition ${(edit.boxType || "GENERAL") === b
                        ? b === "VIP" ? "bg-gradient-to-r from-yellow-300 to-amber-400 border-amber-500 text-amber-950 shadow" : "bg-sky-600 border-sky-600 text-white shadow"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                      {b === "VIP" ? "★ VIP box" : "General box"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="col-span-2">Gift<input className={input} value={edit.giftItem || ""} onChange={(e) => set("giftItem", e.target.value)} placeholder="Sweets box, dry fruits…" /></label>
                <label>Qty<input type="number" min={1} className={input} value={edit.quantity ?? ""} onChange={(e) => set("quantity", e.target.value ? Number(e.target.value) : undefined)} /></label>
              </div>
              <label className="sm:col-span-2">Postal address<textarea rows={2} className={input} value={edit.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="House / flat, street, area" /></label>
              <label>City<input className={input} value={edit.city || ""} onChange={(e) => set("city", e.target.value)} /></label>
              <label>Pincode<input className={input} inputMode="numeric" value={edit.pincode || ""} onChange={(e) => set("pincode", e.target.value)} /></label>
              <label>Contact number<input type="tel" className={input} value={edit.contactNumber || ""} onChange={(e) => set("contactNumber", e.target.value)} /></label>
              <label>Alternate number<input type="tel" className={input} value={edit.alternateNumber || ""} onChange={(e) => set("alternateNumber", e.target.value)} /></label>
              <label>Responsible for delivery
                <input className={input} list="dg-people" value={edit.responsiblePerson || ""} onChange={(e) => set("responsiblePerson", e.target.value)} placeholder="Type or choose" />
                <datalist id="dg-people">{people.map((p) => <option key={p} value={p} />)}</datalist>
              </label>
              <label>Delivery mode
                <select className={input} value={edit.deliveryMode || ""} onChange={(e) => set("deliveryMode", e.target.value)}>
                  {Object.entries(MODES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
              {edit.deliveryMode === "COURIER" && <label>Courier / tracking no.<input className={input} value={edit.trackingNumber || ""} onChange={(e) => set("trackingNumber", e.target.value)} /></label>}
              <label>Planned delivery date<input type="date" className={input} value={edit.plannedDate || ""} onChange={(e) => set("plannedDate", e.target.value)} /></label>
              <label>Status
                <select className={input} value={edit.status} onChange={(e) => set("status", e.target.value)}>
                  {Object.entries(STATUSES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
              </label>
              {edit.status === "DELIVERED" && <label>Delivered on<input type="date" className={input} value={edit.deliveredOn || ""} onChange={(e) => set("deliveredOn", e.target.value)} /></label>}
              <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                <input type="checkbox" checked={!!edit.invitationSent} onChange={(e) => set("invitationSent", e.target.checked)} /> Deewali invitation sent / given
              </label>
              <label className="sm:col-span-2">Remarks<textarea rows={2} className={input} value={edit.remarks || ""} onChange={(e) => set("remarks", e.target.value)} /></label>
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setEdit(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => void save()} disabled={saving} className="px-5 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
