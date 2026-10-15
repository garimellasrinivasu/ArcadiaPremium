import { useEffect, useRef, useState } from "react";
import { loadSheetJS } from "../utils/sheetjs";

const kindOf = (name: string, type: string) => {
  const n = name.toLowerCase();
  if (type === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/")) return "image";
  if (type.includes("wordprocessingml") || n.endsWith(".docx")) return "docx";
  if (type.includes("spreadsheetml") || type.includes("ms-excel") || /\.(xlsx|xls|csv)$/.test(n)) return "sheet";
  if (type.startsWith("text/") || /\.(txt|csv|json)$/.test(n)) return "text";
  return "other";
};

/** Read-only, in-page view of a file's contents (PDF, image, Word, Excel, text). */
export default function FilePreview({ blob, fileName, contentType }: { blob: Blob; fileName: string; contentType: string }) {
  const kind = kindOf(fileName, contentType);
  const [url, setUrl] = useState<string | null>(null);
  const [sheets, setSheets] = useState<{ name: string; html: string }[] | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState("");
  const docxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setError("");
    setSheets(null);
    setText(null);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    (async () => {
      try {
        if (kind === "sheet") {
          const XLSX = await loadSheetJS();
          const wb = XLSX.read(await blob.arrayBuffer(), { type: "array", sheetStubs: true });
          setSheets(wb.SheetNames.map((n: string) => ({ name: n, html: XLSX.utils.sheet_to_html(wb.Sheets[n], { id: "fp-sheet" }) })));
          setActiveSheet(wb.Workbook?.WBView?.[0]?.activeTab ?? 0);
        } else if (kind === "docx" && docxRef.current) {
          const { renderAsync } = await import("docx-preview");
          await renderAsync(blob, docxRef.current, undefined, { className: "docx", inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true, useBase64URL: true });
        } else if (kind === "text") {
          setText((await blob.text()).slice(0, 200000));
        }
      } catch (e: any) {
        setError(e?.message || "Could not display this file");
      }
    })();
    return () => URL.revokeObjectURL(u);
  }, [blob, kind]);

  if (error) return <div className="p-6 text-sm text-red-600">{error}. Use Download to open it.</div>;
  if (kind === "pdf" && url) return <iframe src={url} title={fileName} className="w-full h-full min-h-[60vh] bg-white" />;
  if (kind === "image" && url) return <div className="flex items-center justify-center p-3"><img src={url} alt={fileName} className="max-w-full max-h-[70vh] object-contain shadow" /></div>;
  if (kind === "docx") return <div ref={docxRef} className="bg-gray-200 min-h-[60vh] overflow-auto" />;
  if (kind === "text") return <pre className="p-4 text-xs whitespace-pre-wrap bg-white">{text ?? "Loading…"}</pre>;
  if (kind === "sheet") {
    if (!sheets) return <div className="p-6 text-sm text-gray-500">Opening spreadsheet…</div>;
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-auto text-xs" dangerouslySetInnerHTML={{ __html: sheets[activeSheet]?.html || "" }} />
        <div className="flex gap-1 p-1.5 border-t border-gray-200 bg-gray-50 overflow-x-auto">
          {sheets.map((s, i) => (
            <button key={s.name} onClick={() => setActiveSheet(i)}
              className={`px-2.5 py-1 text-xs rounded border whitespace-nowrap ${i === activeSheet ? "bg-white border-green-600 text-green-800 font-semibold" : "border-transparent text-gray-600 hover:bg-gray-200"}`}>{s.name}</button>
          ))}
        </div>
        <style>{`#fp-sheet{border-collapse:collapse}#fp-sheet td{border:1px solid #e5e7eb;padding:3px 8px;white-space:nowrap}#fp-sheet tr:first-child td{background:#f9fafb;font-weight:600}`}</style>
      </div>
    );
  }
  return <div className="p-6 text-sm text-gray-500">No preview for this file type. Use Download to open it.</div>;
}
