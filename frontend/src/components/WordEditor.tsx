import { useCallback, useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { documentService, type DocumentDto } from "../services/documentService";
import { DocxModel } from "../utils/docxPatch";
import DocumentVersionsPanel from "./DocumentVersionsPanel";

interface Props {
  doc: DocumentDto;
  objectUrl: string;
  canEdit: boolean;
  canDownload: boolean;
  fullscreen?: boolean;
  /** Called after a save or restore with the new file contents */
  onContentChanged: (bytes: Uint8Array, dto: DocumentDto) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Word viewer that renders real pages (docx-preview) and lets permitted users edit paragraph text.
 * Edits go through DocxModel, which changes only the edited words inside word/document.xml.
 */
export default function WordEditor({ doc, objectUrl, canEdit, canDownload, fullscreen, onContentChanged, onDirtyChange }: Props) {
  const [original, setOriginal] = useState<ArrayBuffer | null>(null); // last saved file
  const [model, setModel] = useState<DocxModel | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null); // what is rendered (includes unsaved edits)
  const [loadError, setLoadError] = useState("");
  const [rendering, setRendering] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<{ index: number; text: string; top: number; left: number; width: number; height: number } | null>(null);
  const [undo, setUndo] = useState<{ index: number; prev: string }[]>([]);
  const [changed, setChanged] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [mappedCount, setMappedCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);

  const dirty = undo.length > 0;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const loadFrom = useCallback(async (buf: ArrayBuffer) => {
    const m = await DocxModel.load(buf);
    setOriginal(buf);
    setModel(m);
    setBytes(new Uint8Array(buf));
    setUndo([]);
    setChanged(new Set());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const buf = await (await fetch(objectUrl)).arrayBuffer();
        if (!cancelled) await loadFrom(buf);
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || "Could not read this document");
      }
    })();
    return () => { cancelled = true; };
  }, [objectUrl, loadFrom]);

  // Render pages, then tie each rendered paragraph to its paragraph in the file
  useEffect(() => {
    if (!bytes || !model || !bodyRef.current) return;
    let cancelled = false;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    setRendering(true);
    renderAsync(new Blob([bytes as Uint8Array<ArrayBuffer>]), bodyRef.current, styleRef.current ?? undefined, {
      className: "docx",
      inWrapper: true,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      renderChanges: false,
      useBase64URL: true,
    })
      .then(() => {
        if (cancelled || !bodyRef.current) return;
        const rendered = Array.from(bodyRef.current.querySelectorAll("p")).filter((p) => !p.closest("header, footer"));
        const texts = model.paragraphVisibleTexts().map(norm);
        let j = 0, mapped = 0;
        for (const el of rendered) {
          const t = norm(el.textContent || "");
          let k = j;
          while (k < texts.length && k < j + 8 && texts[k] !== t) k++;
          if (k < texts.length && texts[k] === t) {
            el.dataset.paraIndex = String(k);
            j = k + 1;
            mapped++;
          }
        }
        setMappedCount(mapped);
        if (scrollRef.current) scrollRef.current.scrollTop = scrollTop;
      })
      .catch((e) => !cancelled && setLoadError(e?.message || "This document could not be displayed"))
      .finally(() => !cancelled && setRendering(false));
    return () => { cancelled = true; };
  }, [bytes, model]);

  // Highlight paragraphs changed since the last save
  useEffect(() => {
    bodyRef.current?.querySelectorAll<HTMLElement>("p[data-para-index]").forEach((p) => {
      p.classList.toggle("we-changed", changed.has(Number(p.dataset.paraIndex)));
    });
  }, [changed, rendering]);

  const onBodyClick = (e: React.MouseEvent) => {
    if (!editMode || !model || editing) return;
    const p = (e.target as HTMLElement).closest<HTMLElement>("p[data-para-index]");
    if (!p || !scrollRef.current) return;
    const index = Number(p.dataset.paraIndex);
    const box = p.getBoundingClientRect();
    const host = scrollRef.current.getBoundingClientRect();
    setEditing({
      index,
      text: model.paragraphTexts()[index],
      top: box.top - host.top + scrollRef.current.scrollTop - 4,
      left: box.left - host.left + scrollRef.current.scrollLeft - 4,
      width: Math.max(box.width + 8, 240),
      height: Math.max(box.height + 8, 44),
    });
  };

  const apply = async () => {
    if (!editing || !model) return;
    const prev = model.paragraphTexts()[editing.index];
    setEditing(null);
    if (prev === editing.text) return;
    model.setParagraphText(editing.index, editing.text);
    setUndo((u) => [...u, { index: editing.index, prev }]);
    setChanged((c) => new Set(c).add(editing.index));
    setMessage(null);
    setBytes(await model.toBytes());
  };

  const undoLast = async () => {
    const last = undo[undo.length - 1];
    if (!last || !model) return;
    model.setParagraphText(last.index, last.prev);
    const rest = undo.slice(0, -1);
    setUndo(rest);
    setChanged(new Set(rest.map((u) => u.index)));
    setBytes(await model.toBytes());
  };

  const discard = async () => {
    if (!dirty || !original || !window.confirm("Discard all unsaved changes?")) return;
    setEditing(null);
    setMessage(null);
    await loadFrom(original);
  };

  const save = async () => {
    if (!dirty || !model || saving) return;
    if (!window.confirm(`Save ${changed.size} changed paragraph${changed.size === 1 ? "" : "s"}?\n\nThe current file is kept as a previous version, so you can restore it later.`)) return;
    setSaving(true);
    setMessage(null);
    try {
      const out = await model.toBytes();
      const dto = await documentService.replaceContent(doc.id, out, doc.originalFileName, doc.contentType);
      setOriginal(out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer);
      setUndo([]);
      setChanged(new Set());
      setSavedCount((n) => n + 1);
      onContentChanged(out, dto);
      setMessage({ kind: "ok", text: "Saved. The previous file is kept under Versions." });
    } catch (e: any) {
      setMessage({ kind: "error", text: e?.response?.data?.error || e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="p-6 text-sm text-red-600">
        Failed to display this document: {loadError}. {canDownload && "Use Download to open it in Word."}
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col bg-white ${fullscreen ? "h-full" : "h-[75vh] rounded-lg border border-gray-200"}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        {canEdit ? (
          <button
            onClick={() => { setEditMode((v) => !v); setEditing(null); }}
            className={`px-3 py-1.5 text-xs rounded-md font-medium border ${editMode ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
          >
            {editMode ? "Editing — click a paragraph" : "Edit text"}
          </button>
        ) : (
          <span className="text-xs px-2 py-1 rounded font-medium bg-gray-200 text-gray-600">View only</span>
        )}
        {dirty && <span className="text-xs text-amber-700 font-medium">{changed.size} unsaved paragraph change{changed.size === 1 ? "" : "s"}</span>}
        {rendering && <span className="text-xs text-gray-400">Rendering…</span>}
        <div className="flex-1" />
        {canEdit && (
          <>
            <button onClick={() => void undoLast()} disabled={!undo.length} className="px-3 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40">Undo</button>
            <button onClick={() => void discard()} disabled={!dirty} className="px-3 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40">Discard</button>
            <button onClick={() => void save()} disabled={!dirty || saving} className="px-4 py-1.5 text-xs rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
        <button onClick={() => setShowVersions((v) => !v)} className="px-3 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-100">Versions</button>
      </div>
      {message && (
        <div className={`px-3 py-2 text-xs border-b ${message.kind === "ok" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{message.text}</div>
      )}
      {editMode && (
        <div className="px-3 py-1.5 text-[11px] text-gray-500 border-b border-gray-100 bg-white">
          Click any paragraph or table cell to change its text — formatting of words you don't change is kept. Enter applies, Esc cancels.
          Headers, footers and text boxes are view-only.{mappedCount === 0 && !rendering && " (No editable paragraphs found in this document.)"}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-auto relative bg-gray-200" onClick={onBodyClick}>
          <div ref={styleRef} />
          <div ref={bodyRef} className={editMode ? "we-edit-mode" : ""} />
          {editing && (
            <div className="absolute z-20" style={{ top: editing.top, left: editing.left, width: editing.width }}>
              <textarea
                autoFocus
                value={editing.text}
                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                onKeyDown={(e) => {
                  e.stopPropagation(); // keep the viewer's arrow/F/Esc shortcuts out of the text box
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void apply(); }
                  else if (e.key === "Escape") { e.preventDefault(); setEditing(null); }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-2 text-sm border-2 border-green-600 rounded-md shadow-lg bg-white resize-y"
                style={{ minHeight: editing.height }}
              />
              <div className="flex gap-2 mt-1">
                <button onClick={(e) => { e.stopPropagation(); void apply(); }} className="px-3 py-1 text-xs rounded bg-green-600 text-white">Apply</button>
                <button onClick={(e) => { e.stopPropagation(); setEditing(null); }} className="px-3 py-1 text-xs rounded bg-white border border-gray-300">Cancel</button>
              </div>
            </div>
          )}
        </div>
        {showVersions && (
          <DocumentVersionsPanel
            doc={doc}
            canDownload={canDownload}
            canRestore={canEdit}
            dirty={dirty}
            refreshKey={savedCount}
            onClose={() => setShowVersions(false)}
            onMessage={setMessage}
            onRestored={(b, dto) => {
              void loadFrom(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer);
              onContentChanged(b, dto);
            }}
          />
        )}
      </div>
      <style>{`
        .docx-wrapper { background: #e5e7eb !important; padding: 16px !important; }
        .we-edit-mode p[data-para-index] { cursor: text; border-radius: 2px; }
        .we-edit-mode p[data-para-index]:hover { outline: 2px dashed #16a34a; outline-offset: 1px; background: rgba(22,163,74,.06); }
        p.we-changed { background: #FEF3C7 !important; }
      `}</style>
    </div>
  );
}
