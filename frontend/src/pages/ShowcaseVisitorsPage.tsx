import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { formatDateTime, formatWeekdayDate } from "../utils/date";

interface PageStats { page: string; visits: number; visitors: number; today: number; devices: Record<string, number> }
interface Summary {
  pages: PageStats[];
  daily: ({ date: string } & Record<string, number | string>)[];
  recent: { visitedAt: string; page: string; device: string; referrer?: string }[];
}

const PAGES: { key: string; name: string; color: string }[] = [
  { key: "arcadia", name: "Arcadia Premium", color: "#163B2A" },
  { key: "redfern", name: "Redfern Square", color: "#5A1717" },
  { key: "aalaya-arvindham", name: "Aalaya Arvindham", color: "#17252F" },
];
const nameOf = (k: string) => PAGES.find((p) => p.key === k)?.name || k;
const fmtDay = (d: string) => formatWeekdayDate(d);
const fmtTime = (t: string) => formatDateTime(t);
const errOf = (e: any) => e?.response?.data?.error || e?.message || "Something went wrong";

/** Anonymous visitor counts for the public Deewali showcase pages opened from the QR codes. */
export default function ShowcaseVisitorsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData((await api.get<Summary>("/showcase-visits/summary")).data); }
    catch (e) { setError(errOf(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const total = (f: keyof PageStats) => (data?.pages || []).reduce((s, p) => s + (p[f] as number), 0);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mr-auto">🪔 Showcase Visitors</h1>
        <button onClick={() => void load()} className="px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50">↻ Refresh</button>
      </div>
      <p className="text-xs text-gray-500">
        Visits to the three Deewali greeting pages opened from the QR codes. Visitors are anonymous: no name, phone number or IP address is recorded.
        Reloading the page within 30 minutes is not counted again, and views inside this app are not counted.
      </p>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between gap-2"><span>{error}</span><button onClick={() => setError("")}>&times;</button></div>}
      {loading && !data && <div className="text-sm text-gray-500">Loading…</div>}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[["Total visits", total("visits")], ["Unique visitors", total("visitors")], ["Visits today", total("today")]].map(([l, v]) => (
              <div key={l as string} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">{v as number}</div><div className="text-xs text-gray-500">{l as string}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {PAGES.map(({ key, name, color }) => {
              const p = data.pages.find((x) => x.page === key);
              return (
                <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 text-white text-sm font-semibold" style={{ background: color }}>{name}</div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-3 text-center">
                      <div><div className="text-xl font-bold text-gray-800">{p?.visits ?? 0}</div><div className="text-[11px] text-gray-500">Visits</div></div>
                      <div><div className="text-xl font-bold text-gray-800">{p?.visitors ?? 0}</div><div className="text-[11px] text-gray-500">Unique</div></div>
                      <div><div className="text-xl font-bold text-gray-800">{p?.today ?? 0}</div><div className="text-[11px] text-gray-500">Today</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(p?.devices || {}).map(([d, n]) => (
                        <span key={d} className="px-2 py-0.5 text-[11px] rounded-full border border-gray-200 bg-gray-50 text-gray-700">{d}: <b>{n}</b></span>
                      ))}
                      {!p?.visits && <span className="text-xs text-gray-400">No visits yet</span>}
                    </div>
                    <a href={`/${key}/`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Open page ↗</a>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">Visits by day</div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 sticky top-0">
                    <tr><th className="text-left px-3 py-2">Date</th>{PAGES.map((p) => <th key={p.key} className="text-right px-3 py-2">{p.name}</th>)}<th className="text-right px-3 py-2">Total</th></tr>
                  </thead>
                  <tbody>
                    {data.daily.map((d) => (
                      <tr key={d.date} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 whitespace-nowrap">{fmtDay(d.date)}</td>
                        {PAGES.map((p) => <td key={p.key} className="px-3 py-1.5 text-right">{d[p.key] as number}</td>)}
                        <td className="px-3 py-1.5 text-right font-semibold">{PAGES.reduce((s, p) => s + (d[p.key] as number), 0)}</td>
                      </tr>
                    ))}
                    {!data.daily.length && <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-xs">No visits yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">Latest visits</div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 sticky top-0">
                    <tr><th className="text-left px-3 py-2">Time</th><th className="text-left px-3 py-2">Page</th><th className="text-left px-3 py-2">Device</th><th className="text-left px-3 py-2">From</th></tr>
                  </thead>
                  <tbody>
                    {data.recent.map((v, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 whitespace-nowrap">{fmtTime(v.visitedAt)}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{nameOf(v.page)}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{v.device}</td>
                        <td className="px-3 py-1.5 text-gray-500">{v.referrer || "QR / direct link"}</td>
                      </tr>
                    ))}
                    {!data.recent.length && <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400 text-xs">No visits yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
