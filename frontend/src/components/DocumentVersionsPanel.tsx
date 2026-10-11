import { useEffect, useState } from "react";
import { documentService, type DocumentDto, type DocumentVersionDto } from "../services/documentService";

export const fmtIST = (iso?: string | null) =>
  iso
    ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";
const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Side panel listing a document's earlier versions with Download / Restore (shared by the Excel and Word editors). */
export default function DocumentVersionsPanel({
  doc,
  canDownload,
  canRestore,
  dirty,
  refreshKey,
  onRestored,
  onMessage,
  onClose,
}: {
  doc: DocumentDto;
  canDownload: boolean;
  canRestore: boolean;
  /** Unsaved edits block a restore */
  dirty: boolean;
  /** Change to reload the list (e.g. after a save) */
  refreshKey?: unknown;
  onRestored: (bytes: Uint8Array, dto: DocumentDto) => void;
  onMessage: (m: { kind: "ok" | "error"; text: string }) => void;
  onClose: () => void;
}) {
  const [versions, setVersions] = useState<DocumentVersionDto[] | null>(null);

  useEffect(() => {
    setVersions(null);
    documentService.listVersions(doc.id).then(setVersions).catch(() => setVersions([]));
  }, [doc.id, refreshKey]);

  const download = async (v: DocumentVersionDto) => {
    const blob = await documentService.downloadVersion(doc.id, v.id);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const dot = doc.fileName.lastIndexOf(".");
    a.download = dot > 0 ? `${doc.fileName.slice(0, dot)} (v${v.versionNumber})${doc.fileName.slice(dot)}` : `${doc.fileName} (v${v.versionNumber})`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const restore = async (v: DocumentVersionDto) => {
    if (dirty) { window.alert("Save or discard your unsaved changes first."); return; }
    if (!window.confirm(`Restore version ${v.versionNumber} (saved ${fmtIST(v.createdAt)})?\n\nThe current file will be kept as a new version.`)) return;
    try {
      const dto = await documentService.restoreVersion(doc.id, v.id);
      const res = await fetch(documentService.getViewUrl(doc.id), { headers: { Authorization: `Bearer ${sessionStorage.getItem("token") || ""}` } });
      const bytes = new Uint8Array(await res.arrayBuffer());
      onRestored(bytes, dto);
      setVersions(await documentService.listVersions(doc.id));
      onMessage({ kind: "ok", text: `Version ${v.versionNumber} restored. The file it replaced is kept under Versions.` });
    } catch (e: any) {
      onMessage({ kind: "error", text: e?.response?.data?.error || e.message || "Restore failed" });
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 overflow-auto bg-gray-50 p-3 text-xs flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-800 text-sm">Versions</h4>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
      </div>
      <div className="rounded-md border border-green-200 bg-green-50 p-2 mb-2">
        <div className="font-semibold text-green-900">Current</div>
        <div className="text-gray-600">{doc.updatedAt ? `Saved by ${doc.updatedBy} · ${fmtIST(doc.updatedAt)}` : `Uploaded by ${doc.uploadedBy} · ${fmtIST(doc.createdAt)}`}</div>
      </div>
      {versions === null ? (
        <p className="text-gray-500">Loading…</p>
      ) : versions.length === 0 ? (
        <p className="text-gray-500">No earlier versions yet. A copy is kept here each time the file is saved.</p>
      ) : (
        versions.map((v) => (
          <div key={v.id} className="rounded-md border border-gray-200 bg-white p-2 mb-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">Version {v.versionNumber}</span>
              <span className="text-gray-400">{fmtSize(v.fileSize)}</span>
            </div>
            <div className="text-gray-600 mt-0.5">{v.createdBy || "—"} · {fmtIST(v.createdAt)}</div>
            <div className="text-gray-400">Replaced by {v.replacedBy || "—"} · {fmtIST(v.replacedAt)}</div>
            <div className="flex gap-2 mt-1.5">
              {canDownload && <button onClick={() => void download(v)} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Download</button>}
              {canRestore && <button onClick={() => void restore(v)} className="px-2 py-1 rounded bg-amber-100 text-amber-900 hover:bg-amber-200">Restore</button>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
