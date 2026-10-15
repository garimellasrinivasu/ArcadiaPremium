import { useEffect, useState } from "react";
import FilePreview from "./FilePreview";
import { checklistService, type ChecklistDocumentDto, type TrackerType } from "../services/checklistService";

const fmtSize = (n: number) => (n === 0 ? "0 KB" : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** File viewer for checklist pages, styled like the Project Documents viewer (prev/next, full screen, download). */
export default function ChecklistFileViewer({
  tracker, docs, startId, canDownload, onClose,
}: {
  tracker: TrackerType;
  docs: ChecklistDocumentDto[];
  startId: number;
  canDownload: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(Math.max(0, docs.findIndex((d) => d.id === startId)));
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [full, setFull] = useState(false);
  const doc = docs[index];

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    setBlob(null);
    setError("");
    checklistService.fetchDocument(tracker, doc.id, false)
      .then((b) => !cancelled && setBlob(b))
      .catch((e) => !cancelled && setError(e?.response?.status === 403 ? "You don't have permission to view this file." : "Could not load the file."));
    return () => { cancelled = true; };
  }, [doc, tracker]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (full) setFull(false); else onClose(); }
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(docs.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [docs.length, full, onClose]);

  const download = async () => {
    const b = await checklistService.fetchDocument(tracker, doc.id, true);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = doc.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  };

  if (!doc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className={`bg-white shadow-2xl flex flex-col overflow-hidden ${full ? "w-screen h-screen" : "w-full max-w-6xl h-full sm:h-[92vh] sm:rounded-2xl"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{doc.fileName}</h3>
            <p className="text-xs text-gray-500">{fmtSize(doc.fileSize)} · {doc.uploadedBy}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {docs.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-600">
                <button onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">‹ Prev</button>
                <span>{index + 1} / {docs.length}</span>
                <button onClick={() => setIndex(Math.min(docs.length - 1, index + 1))} disabled={index === docs.length - 1} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">Next ›</button>
              </div>
            )}
            <button onClick={() => setFull(!full)} className="px-3 py-1.5 text-xs font-medium text-white bg-arcadia-600 hover:bg-arcadia-700 rounded-lg">{full ? "Exit Full Screen" : "Full Screen"}</button>
            {canDownload && <button onClick={() => void download()} className="px-3 py-1.5 text-xs font-medium text-arcadia-700 bg-arcadia-50 hover:bg-arcadia-100 rounded-lg">Download</button>}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg text-lg leading-none">&times;</button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto bg-gray-100">
          {error ? <div className="p-8 text-center text-sm text-red-600">{error}</div>
            : !blob ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm justify-center py-16">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" /> Loading {doc.fileName}…
              </div>
            ) : <FilePreview key={doc.id} blob={blob} fileName={doc.fileName} contentType={doc.contentType} />}
        </div>
      </div>
    </div>
  );
}
