import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import api from "../services/api";
import { formatWeekdayDate, formatTime, formatDateTime } from "../utils/date";

interface Photo {
  id: number; w?: number; h?: number; capturedAt: string; dateGuessed: boolean; uploadedBy?: string;
  caption?: string; highlight: boolean; hidden: boolean; latitude?: number; longitude?: number; uploadedAt?: string;
  type: "PHOTO" | "VIDEO"; live: boolean; duration?: number; status: "READY" | "PROCESSING" | "FAILED"; statusNote?: string;
  deletedAt?: string; deletedBy?: string; undated: boolean;
}
interface DayMeta { title?: string; place?: string; story?: string }
interface Album {
  id: number; slug: string; title: string; subtitle?: string; coverPhotoId?: number; hasPin: boolean;
  startDate?: string | null; endDate?: string | null;
  friends: string[]; days: Record<string, DayMeta>; photos: Photo[];
}
interface Visits {
  visits: number; visitors: number; today: number; devices: Record<string, number>; places: Record<string, number>;
  people: { name: string; visits: number; lastVisit: string }[];
  recent: { visitedAt: string; name?: string; device: string; location?: string }[];
}
interface AlbumRow { id: number; slug: string; title: string; photos: number; hasPin: boolean }

const errOf = (e: any) => e?.response?.data?.error || e?.message || "Something went wrong";
const UNDATED = "undated";
// Photos without a capture date are grouped last, so their date can be set
const dayOf = (p: Photo) => (p.undated ? UNDATED : (p.capturedAt || "").slice(0, 10));

/** Admin side of the trip memories page: link & PIN, day stories, captions, highlights, hide / delete. */
export default function TripMemoriesPage() {
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [albumId, setAlbumId] = useState<number | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [days, setDays] = useState<Record<string, DayMeta>>({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState({ title: "Vietnam & Phuket 2026", subtitle: "", pin: "" });
  const [newPin, setNewPin] = useState("");
  const [savingDays, setSavingDays] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [moveDate, setMoveDate] = useState("");
  const [editingDate, setEditingDate] = useState<number | null>(null);
  const togglePick = (id: number) => setPicked((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const loadList = useCallback(async () => {
    try {
      const list = (await api.get<AlbumRow[]>("/trip-memories")).data;
      setAlbums(list);
      setAlbumId((cur) => cur ?? list[0]?.id ?? null);
    } catch (e) { setError(errOf(e)); }
    setLoading(false);
  }, []);
  useEffect(() => { void loadList(); }, [loadList]);

  const loadAlbum = useCallback(async (id: number) => {
    try {
      const a = (await api.get<Album>(`/trip-memories/${id}`)).data;
      setAlbum(a); setDays(a.days || {});
    } catch (e) { setError(errOf(e)); }
  }, []);
  useEffect(() => { if (albumId) void loadAlbum(albumId); }, [albumId, loadAlbum]);

  const [visits, setVisits] = useState<Visits | null>(null);
  const loadVisits = useCallback(async () => {
    try { setVisits((await api.get<Visits>("/showcase-visits/memories")).data); } catch { setVisits(null); }
  }, []);
  useEffect(() => { void loadVisits(); }, [loadVisits]);

  // Full file name so the link also works on the local dev server, which sends folder addresses to the app
  const link = album ? `${window.location.origin}/memories/index.html?a=${album.slug}` : "";
  const thumb = (p: Photo) => `/api/trip-memories/public/${album?.slug}/photos/${p.id}/thumb`;

  const grouped = useMemo(() => {
    const g: Record<string, Photo[]> = {};
    (album?.photos || []).filter((p) => !p.deletedAt).forEach((p) => { (g[dayOf(p)] ||= []).push(p); });
    // Every trip day is listed (so its story can be written), even before photos from it arrive
    if (album?.startDate && album?.endDate) {
      for (let t = Date.parse(album.startDate); t <= Date.parse(album.endDate); t += 86400000) {
        const k = new Date(t).toISOString().slice(0, 10);
        g[k] ||= [];
      }
    }
    return Object.entries(g).sort(([a], [b]) => (a === UNDATED ? 1 : b === UNDATED ? -1 : a.localeCompare(b)));
  }, [album]);
  const firstDay = album?.startDate || grouped[0]?.[0];
  const dayNo = (k: string) => firstDay ? Math.round((Date.parse(k) - Date.parse(firstDay)) / 86400000) + 1 : 1;

  const create = async () => {
    setError("");
    try {
      const a = (await api.post<Album>("/trip-memories", creating)).data;
      await loadList(); setAlbumId(a.id); flash("Album created");
    } catch (e) { setError(errOf(e)); }
  };

  const saveAlbum = async (body: Record<string, unknown>, msg: string) => {
    if (!album) return;
    setError("");
    try {
      const a = (await api.put<Album>(`/trip-memories/${album.id}`, body)).data;
      setAlbum(a); flash(msg);
    } catch (e) { setError(errOf(e)); }
  };

  const saveDays = async () => {
    setSavingDays(true);
    const clean: Record<string, DayMeta> = {};
    Object.entries(days).forEach(([k, v]) => { if (v.title || v.place || v.story) clean[k] = v; });
    await saveAlbum({ days: clean }, "Day stories saved");
    setSavingDays(false);
  };

  const updatePhoto = async (p: Photo, body: Record<string, unknown>) => {
    if (!album) return;
    try {
      const u = (await api.put<Photo>(`/trip-memories/${album.id}/photos/${p.id}`, body)).data;
      setAlbum({ ...album, photos: album.photos.map((x) => (x.id === p.id ? { ...x, ...u } : x)).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt) || a.id - b.id) });
    } catch (e) { setError(errOf(e)); }
  };

  const deletePhoto = async (p: Photo) => {
    if (!album || !confirm(`Delete this ${p.type === "VIDEO" ? "video" : "photo"} by ${p.uploadedBy || "someone"} permanently? (Use Hide to keep it but not show it.)`)) return;
    try {
      await api.delete(`/trip-memories/${album.id}/photos/${p.id}`);
      setAlbum({ ...album, photos: album.photos.filter((x) => x.id !== p.id) }); flash("Photo deleted");
    } catch (e) { setError(errOf(e)); }
  };

  const deleted = (album?.photos || []).filter((p) => p.deletedAt);

  /** hide / show / restore / delete (permanently) / move (to another day) for several items */
  const bulk = async (action: "hide" | "show" | "restore" | "delete" | "move", ids: number[], date?: string) => {
    if (!album || !ids.length) return;
    if (action === "delete" && !confirm(`Delete ${ids.length} item${ids.length === 1 ? "" : "s"} permanently? This can't be undone.`)) return;
    try {
      const r = (await api.post<{ count: number }>(`/trip-memories/${album.id}/photos/bulk`, { action, ids, date })).data;
      const word = { hide: "hidden", show: "shown", restore: "restored", delete: "deleted permanently", move: `moved to ${date ? formatWeekdayDate(date) : "the new date"}` }[action];
      flash(`${r.count} ${word}`); setPicked(new Set()); if (action === "move") setMoveDate("");
      await loadAlbum(album.id);
    } catch (e) { setError(errOf(e)); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); flash("Link copied"); } catch { flash("Select the link and copy it"); }
  };

  const downloadQr = () => {
    const c = document.getElementById("memories-qr") as HTMLCanvasElement | null;
    if (!c || !album) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png"); a.download = `${album.title} QR.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mr-auto">📸 Trip Memories</h1>
        {albumId && <button onClick={() => { void loadAlbum(albumId); void loadVisits(); }} className="px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50">↻ Refresh</button>}
        {albums.length > 1 && (
          <select value={albumId ?? ""} onChange={(e) => setAlbumId(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
            {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        )}
      </div>

      {toast && <div className="p-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">{toast}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between gap-2"><span>{error}</span><button onClick={() => setError("")}>&times;</button></div>}

      {!albums.length && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 max-w-lg">
          <h2 className="font-semibold text-gray-800">Create the memories album</h2>
          <label className="block text-xs text-gray-600">Title
            <input value={creating.title} onChange={(e) => setCreating({ ...creating, title: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
          </label>
          <label className="block text-xs text-gray-600">Subtitle (optional)
            <input value={creating.subtitle} onChange={(e) => setCreating({ ...creating, subtitle: e.target.value })} placeholder="Eleven friends, two countries, one unforgettable trip"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
          </label>
          <label className="block text-xs text-gray-600">Upload PIN (4–8 digits, share it only in the friends' group)
            <input value={creating.pin} inputMode="numeric" maxLength={8} onChange={(e) => setCreating({ ...creating, pin: e.target.value.replace(/\D/g, "") })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
          </label>
          <button onClick={() => void create()} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">Create album</button>
        </div>
      )}

      {album && (
        <>
          {/* Link, QR and PIN */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
            <div className="p-2 border border-gray-200 rounded-xl self-center"><QRCodeCanvas id="memories-qr" value={link} size={140} level="M" marginSize={2} fgColor="#0b1d26" /></div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-xs text-gray-500">Share this link in the friends' WhatsApp group. Anyone with it can view; uploading needs the PIN.</div>
              <a href={link} target="_blank" rel="noreferrer" className="block text-sm text-blue-700 break-all hover:underline">{link}</a>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void copyLink()} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300">📋 Copy link</button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`📸 ${album.title}\nOur trip photos, day by day. Add yours too!\n${link}`)}`} target="_blank" rel="noreferrer"
                  className="px-3 py-1.5 text-xs rounded-lg bg-[#25D366] text-white">Share on WhatsApp</a>
                <button onClick={downloadQr} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300">⬇ QR image</button>
                <a href={link} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-white">Open page ↗</a>
                <a href={`${link}#upload`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-400 text-amber-950">＋ Add photos ↗</a>
              </div>
              <div className="flex flex-wrap items-end gap-2 pt-1">
                <label className="text-xs text-gray-600">Change upload PIN
                  <input value={newPin} inputMode="numeric" maxLength={8} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="New PIN"
                    className="mt-1 block w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </label>
                <button disabled={newPin.length < 4} onClick={() => void saveAlbum({ pin: newPin }, "PIN changed").then(() => setNewPin(""))}
                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white disabled:opacity-50">Save PIN</button>
                <span className="text-[11px] text-gray-400">The PIN isn't shown again after saving.</span>
              </div>
            </div>
          </div>

          {/* Visitors */}
          {visits && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-800 mr-auto">👀 Visitors</h2>
                <span className="text-[11px] text-gray-400">Reloads within 30 minutes and previews inside the app aren't counted</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[["Visits", visits.visits], ["Unique visitors", visits.visitors], ["Today", visits.today]].map(([l, v]) => (
                  <div key={l as string} className="border border-gray-200 rounded-lg p-2 text-center">
                    <div className="text-xl font-bold text-gray-800">{v as number}</div><div className="text-[11px] text-gray-500">{l as string}</div>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="font-semibold text-gray-600 mb-1">Friends who opened it</div>
                  {visits.people.length ? (
                    <ul className="space-y-0.5">
                      {visits.people.map((p) => (
                        <li key={p.name} className="flex justify-between gap-2"><span>{p.name} <span className="text-gray-400">· {p.visits}×</span></span><span className="text-gray-400">{formatDateTime(p.lastVisit)}</span></li>
                      ))}
                    </ul>
                  ) : <div className="text-gray-400">Names show once a friend has picked their name on the page (when adding photos).</div>}
                </div>
                <div>
                  <div className="font-semibold text-gray-600 mb-1">Top places</div>
                  {Object.keys(visits.places).length ? (
                    <ul className="space-y-0.5">{Object.entries(visits.places).map(([pl, n]) => <li key={pl} className="flex justify-between gap-2"><span className="truncate">{pl}</span><b>{n}</b></li>)}</ul>
                  ) : <div className="text-gray-400">No places yet</div>}
                </div>
                <div>
                  <div className="font-semibold text-gray-600 mb-1">Devices</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(visits.devices).map(([d, n]) => <span key={d} className="px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50">{d}: <b>{n}</b></span>)}
                    {!visits.visits && <span className="text-gray-400">No visits yet</span>}
                  </div>
                </div>
              </div>
              {visits.recent.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-700">Latest visits ({visits.recent.length})</summary>
                  <div className="overflow-x-auto max-h-72 mt-2">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-gray-500"><tr><th className="text-left px-2 py-1">Time</th><th className="text-left px-2 py-1">Friend</th><th className="text-left px-2 py-1">Place</th><th className="text-left px-2 py-1">Device</th></tr></thead>
                      <tbody>
                        {visits.recent.map((v, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-2 py-1 whitespace-nowrap">{formatDateTime(v.visitedAt)}</td>
                            <td className="px-2 py-1">{v.name || <span className="text-gray-400">—</span>}</td>
                            <td className="px-2 py-1">{v.location || <span className="text-gray-400">—</span>}</td>
                            <td className="px-2 py-1 whitespace-nowrap">{v.device}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Title */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block text-xs text-gray-600">Title
              <input defaultValue={album.title} key={`t-${album.id}`} onBlur={(e) => e.target.value.trim() && e.target.value !== album.title && void saveAlbum({ title: e.target.value }, "Title saved")}
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
            </label>
            <label className="block text-xs text-gray-600">Subtitle
              <input defaultValue={album.subtitle || ""} key={`s-${album.id}`} onBlur={(e) => e.target.value !== (album.subtitle || "") && void saveAlbum({ subtitle: e.target.value }, "Subtitle saved")}
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
            </label>
            <label className="block text-xs text-gray-600">Trip start (Day 1)
              <input type="date" value={album.startDate || ""} onChange={(e) => void saveAlbum({ startDate: e.target.value }, "Trip start saved")}
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
            </label>
            <label className="block text-xs text-gray-600">Trip end (last day)
              <input type="date" value={album.endDate || ""} min={album.startDate || undefined} onChange={(e) => void saveAlbum({ endDate: e.target.value }, "Trip end saved")}
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
            </label>
          </div>

          <div className="text-sm text-gray-600">
            {album.photos.filter((p) => !p.deletedAt && p.type !== "VIDEO").length} photos · {album.photos.filter((p) => !p.deletedAt && p.type === "VIDEO").length} videos · {album.photos.filter((p) => p.hidden).length} hidden · {album.photos.filter((p) => p.undated).length} without a date
            {album.photos.some((p) => p.status === "PROCESSING") && <span className="text-amber-700"> · videos being prepared, press ↻ Refresh in a minute</span>}
          </div>

          {deleted.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-orange-200 text-sm font-semibold text-orange-900 flex flex-wrap items-center gap-2">
                <span className="mr-auto">🗑 Recently deleted by friends ({deleted.length})</span>
                <button onClick={() => void bulk("restore", deleted.map((p) => p.id))} className="px-3 py-1 text-xs rounded-lg bg-white border border-orange-300">↩ Restore all</button>
                <button onClick={() => void bulk("delete", deleted.map((p) => p.id))} className="px-3 py-1 text-xs rounded-lg bg-orange-700 text-white">Delete all forever</button>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {deleted.map((p) => (
                  <div key={p.id} className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                    <img src={thumb(p)} alt="" loading="lazy" className="w-full aspect-square object-cover bg-gray-100" />
                    <div className="p-1 text-[10px] text-gray-600 truncate" title={`Deleted by ${p.deletedBy}`}>by {p.deletedBy}</div>
                    <div className="flex justify-between px-1 pb-1 text-[11px]">
                      <button onClick={() => void bulk("restore", [p.id])} className="text-blue-700">↩ Restore</button>
                      <button onClick={() => void bulk("delete", [p.id])} className="text-red-700">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days */}
          {grouped.map(([k, list]) => {
            const m = days[k] || {};
            const setM = (v: DayMeta) => setDays({ ...days, [k]: { ...m, ...v } });
            return (
              <div key={k} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="mr-auto">{k === UNDATED ? "No capture date: set when each was taken" : `Day ${dayNo(k)} · ${formatWeekdayDate(k)}`} · {list.length} items</span>
                    <button className="text-xs font-normal text-blue-700 hover:underline"
                      onClick={() => setPicked((cur) => { const n = new Set(cur); const all = list.every((p) => n.has(p.id)); list.forEach((p) => (all ? n.delete(p.id) : n.add(p.id))); return n; })}>
                      {list.every((p) => picked.has(p.id)) ? "Unselect day" : "Select day"}
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {k !== UNDATED && (<>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={m.title || ""} onChange={(e) => setM({ title: e.target.value })} placeholder={`Day title, e.g. "Hello Hanoi!"`} className="border border-gray-300 rounded-lg px-2 py-2 text-sm" />
                    <input value={m.place || ""} onChange={(e) => setM({ place: e.target.value })} placeholder="Place, e.g. Hanoi Old Quarter" className="border border-gray-300 rounded-lg px-2 py-2 text-sm" />
                  </div>
                  <textarea value={m.story || ""} onChange={(e) => setM({ story: e.target.value })} rows={2} placeholder="A few lines about the day…" className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
                  </>)}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {list.map((p) => (
                      <div key={p.id} className={`rounded-lg border overflow-hidden ${picked.has(p.id) ? "ring-2 ring-blue-500 border-blue-500" : p.hidden ? "opacity-40 border-gray-200" : p.highlight ? "border-amber-400 ring-1 ring-amber-300" : "border-gray-200"}`}>
                        <div className="relative">
                          <input type="checkbox" checked={picked.has(p.id)} onChange={() => togglePick(p.id)} title="Select"
                            className="absolute bottom-1 right-1 z-10 w-5 h-5 accent-blue-600 cursor-pointer" />
                          {p.type === "VIDEO" && p.status !== "READY" ? (
                            <div className={`w-full aspect-square flex items-center justify-center text-center text-[11px] p-2 ${p.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                              {p.status === "FAILED" ? `🎬 Video not added: ${p.statusNote || "could not convert"}` : "🎬 Video being prepared…"}
                            </div>
                          ) : (
                            <img src={thumb(p)} alt="" loading="lazy" className="w-full aspect-square object-cover bg-gray-100" />
                          )}
                          {p.type === "VIDEO" && p.status === "READY" && <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">▶ {Math.floor((p.duration || 0) / 60)}:{String(Math.round(p.duration || 0) % 60).padStart(2, "0")}</span>}
                          {p.live && <span className="absolute bottom-1 left-1 text-[10px] bg-white/85 text-gray-800 px-1.5 py-0.5 rounded font-semibold">◉ LIVE</span>}
                          {album.coverPhotoId === p.id && <span className="absolute top-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">Cover</span>}
                          {p.undated ? <span className="absolute top-1 right-1 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded" title="No capture date in the photo; upload time used">No date</span>
                            : p.dateGuessed && <span className="absolute top-1 right-1 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded" title="No date inside the photo; its file date was used. Check the time if it looks wrong.">File date</span>}
                        </div>
                        <div className="p-1.5 space-y-1">
                          <div className="text-[10px] text-gray-500 truncate">📷 {p.uploadedBy} · {formatTime(p.capturedAt)}</div>
                          <input defaultValue={p.caption || ""} key={`c-${p.id}-${p.caption || ""}`} placeholder="Caption"
                            onBlur={(e) => e.target.value !== (p.caption || "") && void updatePhoto(p, { caption: e.target.value })}
                            className="w-full border border-gray-200 rounded px-1.5 py-1 text-[11px]" />
                          {(p.undated || editingDate === p.id) && (
                            <input type="datetime-local" defaultValue={p.capturedAt.slice(0, 16)} title="When it was taken" autoFocus={editingDate === p.id}
                              onBlur={(e) => {
                                setEditingDate(null);
                                if (e.target.value && e.target.value !== p.capturedAt.slice(0, 16)) void updatePhoto(p, { capturedAt: e.target.value }).then(() => flash(`Moved to ${formatWeekdayDate(e.target.value)}`));
                              }}
                              className="w-full border border-blue-300 rounded px-1 py-0.5 text-[10px]" />
                          )}
                          <div className="flex justify-between text-sm">
                            <button title={p.highlight ? "Remove highlight" : "Highlight (shown large)"} onClick={() => void updatePhoto(p, { highlight: !p.highlight })}>{p.highlight ? "⭐" : "☆"}</button>
                            <button title="Use as cover photo" onClick={() => void saveAlbum({ coverPhotoId: p.id }, "Cover photo set")}>🖼️</button>
                            <button title="Change date and time" onClick={() => setEditingDate(editingDate === p.id ? null : p.id)}>📅</button>
                            <button title={p.hidden ? "Show on the page" : "Hide from the page"} onClick={() => void updatePhoto(p, { hidden: !p.hidden })}>{p.hidden ? "🙈" : "👁️"}</button>
                            <button title="Delete permanently" onClick={() => void deletePhoto(p)}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {grouped.length > 0 && (
            <div className="sticky bottom-3 flex flex-wrap justify-end gap-2">
              {picked.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-white border border-blue-200 shadow-lg rounded-lg px-3 py-2 text-sm">
                  <b className="text-blue-800">{picked.size} selected</b>
                  <button onClick={() => void bulk("hide", [...picked])} className="px-2.5 py-1 text-xs rounded border border-gray-300">🙈 Hide</button>
                  <button onClick={() => void bulk("show", [...picked])} className="px-2.5 py-1 text-xs rounded border border-gray-300">👁️ Show</button>
                  <span className="flex items-center gap-1 border border-gray-300 rounded px-1.5 py-0.5">
                    <span className="text-xs text-gray-600">📅 Move to</span>
                    <input type="date" value={moveDate} min={album.startDate || undefined} max={album.endDate || undefined}
                      onChange={(e) => setMoveDate(e.target.value)} className="text-xs border-0 p-0.5" />
                    <button disabled={!moveDate} onClick={() => void bulk("move", [...picked], moveDate)}
                      className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white disabled:opacity-40">Move</button>
                  </span>
                  <button onClick={() => void bulk("delete", [...picked])} className="px-2.5 py-1 text-xs rounded bg-red-600 text-white">🗑 Delete permanently</button>
                  <button onClick={() => setPicked(new Set())} className="px-2 py-1 text-xs text-gray-500">Clear</button>
                </div>
              )}
              <button onClick={() => void saveDays()} disabled={savingDays} className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 disabled:opacity-50">
                {savingDays ? "Saving…" : "💾 Save day titles & stories"}
              </button>
            </div>
          )}
          {!grouped.length && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3">
              <div className="text-sm text-gray-600">No photos yet. Add the first ones: choose your name, enter the PIN and pick photos. They're arranged by the day they were taken.</div>
              <div className="flex flex-wrap justify-center gap-2">
                <a href={`${link}#upload`} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-400 text-amber-950">＋ Add photos</a>
                <a href={link} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-white">View the page ↗</a>
              </div>
              <div className="text-xs text-gray-400">Photos and day stories you add then show up here to caption, highlight or hide.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
