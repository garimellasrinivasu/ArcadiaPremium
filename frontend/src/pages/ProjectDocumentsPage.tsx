import { useState, useEffect, useCallback, useRef } from "react";
import { projectService, type ProjectDto } from "../services/projectService";
import { documentService, type DocumentDto, type UploadHandle } from "../services/documentService";
import { folderService, type FolderDto } from "../services/folderService";
import { authService } from "../services/authService";
import type { User } from "../types/user";

/* ─── helpers ─── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function fileIcon(contentType: string): string {
  if (contentType === "application/pdf") return "\u{1F4C4}";
  if (contentType.startsWith("image/")) return "\u{1F5BC}";
  if (contentType.includes("wordprocessingml")) return "\u{1F4DD}";
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "\u{1F4CA}";
  if (contentType.includes("spreadsheetml") || contentType.includes("ms-excel")) return "\u{1F4CA}";
  return "\u{1F4CE}";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Breadcrumb path item ─── */
interface BreadcrumbItem {
  id: number | null; // null = root
  name: string;
}

/* ─── Folder Tree Item (recursive) ─── */
function FolderTreeNode({
  folder,
  depth,
  selectedFolderId,
  onSelect,
  expandedIds,
  onToggle,
}: {
  folder: FolderDto;
  depth: number;
  selectedFolderId: number | null;
  onSelect: (id: number) => void;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  const isSelected = selectedFolderId === folder.id;
  const isExpanded = expandedIds.has(folder.id);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer text-sm transition
          ${isSelected ? "bg-arcadia-100 text-arcadia-800 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(folder.id); }}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 flex-shrink-0"
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        <span className="flex-shrink-0">{isExpanded && hasChildren ? "\u{1F4C2}" : "\u{1F4C1}"}</span>
        <span className="truncate">{folder.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── File Viewer Modal (with prev/next navigation) ─── */
/** In-memory cache for viewed document blobs — avoids re-fetching on navigation */
const docBlobCache = new Map<number, string>(); // doc.id → objectUrl

function FileViewerModal({
  doc,
  allDocs,
  onClose,
  onNavigate,
}: {
  doc: DocumentDto;
  allDocs: DocumentDto[];
  onClose: () => void;
  onNavigate: (doc: DocumentDto) => void;
}) {
  const token = sessionStorage.getItem("token") || "";
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [xlsxHtml, setXlsxHtml] = useState<string>("");
  const [xlsxSheets, setXlsxSheets] = useState<string[]>([]);
  const [xlsxActiveSheet, setXlsxActiveSheet] = useState(0);
  const [xlsxAllHtml, setXlsxAllHtml] = useState<Record<string, string>>({});

  const isImage = doc.contentType.startsWith("image/");
  const isPdf = doc.contentType === "application/pdf";
  const isDocx = doc.contentType.includes("wordprocessingml");
  const isPpt = doc.contentType.includes("presentation") || doc.contentType.includes("powerpoint");
  const isXlsx = doc.contentType.includes("spreadsheetml") || doc.contentType.includes("ms-excel");
  const isOfficeDoc = isDocx || isPpt; // XLSX is now rendered inline, not downloaded

  // Navigation: find current index and prev/next docs
  const currentIndex = allDocs.findIndex((d) => d.id === doc.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allDocs.length - 1;

  function goPrev() {
    if (hasPrev) onNavigate(allDocs[currentIndex - 1]);
  }
  function goNext() {
    if (hasNext) onNavigate(allDocs[currentIndex + 1]);
  }

  // Keyboard navigation: left/right arrows, Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, allDocs.length]);

  // Preload adjacent documents in background for instant navigation
  useEffect(() => {
    const preloadIds: number[] = [];
    if (hasPrev) preloadIds.push(allDocs[currentIndex - 1].id);
    if (hasNext) preloadIds.push(allDocs[currentIndex + 1].id);
    preloadIds.forEach((id) => {
      if (!docBlobCache.has(id)) {
        fetch(documentService.getViewUrl(id), {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.ok ? r.blob() : null)
          .then((blob) => {
            if (blob) docBlobCache.set(id, URL.createObjectURL(blob));
          })
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  useEffect(() => {
    let cancelled = false;
    setError("");

    // Check cache first — instant display for previously viewed files
    const cached = docBlobCache.get(doc.id);
    if (cached) {
      setObjectUrl(cached);
      setLoading(false);
      if (isOfficeDoc) {
        const a = document.createElement("a");
        a.href = cached;
        a.download = doc.originalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    setLoading(true);
    setObjectUrl(null);
    async function loadFile() {
      try {
        const res = await fetch(documentService.getViewUrl(doc.id), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load file");
        const blob = await res.blob();
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          docBlobCache.set(doc.id, url); // Cache for future views
          setObjectUrl(url);
          if (isOfficeDoc) {
            const a = document.createElement("a");
            a.href = url;
            a.download = doc.originalFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadFile();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  // Parse XLSX files into HTML tables using SheetJS (loaded from CDN)
  useEffect(() => {
    if (!isXlsx || !objectUrl) return;
    setXlsxHtml("");
    setXlsxSheets([]);
    setXlsxAllHtml({});
    setXlsxActiveSheet(0);

    async function parseXlsx() {
      try {
        // Dynamically load SheetJS from CDN if not already loaded
        if (!(window as any).XLSX) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load SheetJS"));
            document.head.appendChild(script);
          });
        }
        const XLSX = (window as any).XLSX;
        const resp = await fetch(objectUrl!);
        const arrayBuffer = await resp.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheets = workbook.SheetNames as string[];
        setXlsxSheets(sheets);
        const allHtml: Record<string, string> = {};
        sheets.forEach((name: string) => {
          allHtml[name] = XLSX.utils.sheet_to_html(workbook.Sheets[name], { id: "xlsx-table" });
        });
        setXlsxAllHtml(allHtml);
        if (sheets.length > 0) setXlsxHtml(allHtml[sheets[0]]);
      } catch (e: any) {
        console.error("XLSX parse error:", e);
        setXlsxHtml(`<p style="color:red;padding:20px;">Failed to render spreadsheet: ${e.message}</p>`);
      }
    }
    parseXlsx();
  }, [objectUrl, isXlsx]);

  // Don't revoke on unmount — cache keeps URLs alive for re-use
  // Cache is cleared naturally when user navigates away from the page

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Previous arrow — hidden on mobile (use header buttons) */}
      {hasPrev && (
        <button onClick={goPrev}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-[60] bg-white/90 hover:bg-white text-gray-700 hover:text-arcadia-700 rounded-full w-11 h-11 items-center justify-center shadow-lg transition text-xl font-bold"
          title="Previous file (Left arrow)">
          &#8249;
        </button>
      )}

      {/* Next arrow — hidden on mobile */}
      {hasNext && (
        <button onClick={goNext}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-[60] bg-white/90 hover:bg-white text-gray-700 hover:text-arcadia-700 rounded-full w-11 h-11 items-center justify-center shadow-lg transition text-xl font-bold"
          title="Next file (Right arrow)">
          &#8250;
        </button>
      )}

      <div className="bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-200 bg-gray-50">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{doc.fileName}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">
              {formatFileSize(doc.fileSize)}
              {allDocs.length > 1 && (
                <span className="ml-1 sm:ml-2 text-gray-500 font-medium">
                  ({currentIndex + 1} of {allDocs.length})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
            {/* Prev / Next buttons in header */}
            {allDocs.length > 1 && (
              <div className="flex items-center gap-1 mr-1 sm:mr-2">
                <button onClick={goPrev} disabled={!hasPrev}
                  className="px-2 py-1 text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous">
                  &#8249;
                </button>
                <button onClick={goNext} disabled={!hasNext}
                  className="px-2 py-1 text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next">
                  &#8250;
                </button>
              </div>
            )}
            {objectUrl && (
              <a href={objectUrl} download={doc.originalFileName}
                className="hidden sm:inline-block px-3 py-1.5 text-xs font-medium text-arcadia-700 bg-arcadia-50 hover:bg-arcadia-100 rounded-lg transition">
                Download
              </a>
            )}
            <button onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition text-lg leading-none">
              &times;
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-2 sm:p-4">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
              Loading file...
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!loading && !error && isPdf && objectUrl && (
            <iframe src={objectUrl} title={doc.fileName} className="w-full h-full min-h-[50vh] sm:min-h-[70vh] rounded-lg border" />
          )}
          {!loading && !error && isImage && objectUrl && (
            <img src={objectUrl} alt={doc.fileName} className="max-w-full max-h-[60vh] sm:max-h-[75vh] object-contain rounded-lg shadow" />
          )}
          {!loading && !error && isOfficeDoc && objectUrl && (
            <div className="text-center space-y-4 py-12">
              <div className="text-6xl">{fileIcon(doc.contentType)}</div>
              <p className="text-gray-700 font-medium">File downloaded successfully!</p>
              <p className="text-gray-500 text-sm">
                "{doc.originalFileName}" has been downloaded.<br />
                Open it with {isPpt ? "PowerPoint" : "Word"} on your device.
              </p>
              <a href={objectUrl} download={doc.originalFileName}
                className="inline-block px-5 py-2.5 bg-arcadia-600 text-white font-medium rounded-lg hover:bg-arcadia-700 transition">
                Download Again
              </a>
            </div>
          )}
          {!loading && !error && isXlsx && objectUrl && (
            <div className="w-full h-full flex flex-col min-h-[70vh]">
              {/* Sheet tabs */}
              {xlsxSheets.length > 1 && (
                <div className="flex gap-1 px-3 py-2 bg-white border-b border-gray-200 overflow-x-auto flex-shrink-0">
                  {xlsxSheets.map((name, i) => (
                    <button key={name} onClick={() => { setXlsxActiveSheet(i); setXlsxHtml(xlsxAllHtml[name] || ""); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                        i === xlsxActiveSheet
                          ? "bg-arcadia-100 text-arcadia-700 border border-arcadia-300"
                          : "text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}>
                      {name}
                    </button>
                  ))}
                </div>
              )}
              {/* Spreadsheet HTML table */}
              <div className="flex-1 overflow-auto bg-white rounded-lg"
                dangerouslySetInnerHTML={{ __html: xlsxHtml }}
                style={{
                  fontSize: "13px",
                }}
              />
              <style>{`
                #xlsx-table { border-collapse: collapse; width: 100%; }
                #xlsx-table td, #xlsx-table th {
                  border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left;
                  white-space: nowrap; max-width: 300px; overflow: hidden; text-overflow: ellipsis;
                }
                #xlsx-table tr:first-child td, #xlsx-table th {
                  background: #f9fafb; font-weight: 600; color: #374151;
                  position: sticky; top: 0; z-index: 1;
                }
                #xlsx-table tr:hover td { background: #f0fdf4; }
              `}</style>
            </div>
          )}
        </div>

        {/* Thumbnail strip for quick navigation — hidden on small mobile */}
        {allDocs.length > 1 && (
          <div className="hidden sm:block border-t border-gray-200 bg-gray-50 px-4 py-2 overflow-x-auto always-scroll">
            <div className="flex gap-2 items-center justify-center min-w-min">
              {allDocs.map((d) => (
                <button key={d.id} onClick={() => onNavigate(d)}
                  className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition text-center min-w-[60px] ${
                    d.id === doc.id
                      ? "bg-arcadia-100 border border-arcadia-300 shadow-sm"
                      : "hover:bg-gray-100 border border-transparent"
                  }`}>
                  <span className="text-lg">{fileIcon(d.contentType)}</span>
                  <span className={`text-[9px] leading-tight truncate max-w-[56px] ${
                    d.id === doc.id ? "text-arcadia-700 font-semibold" : "text-gray-500"
                  }`}>
                    {d.fileName.length > 8 ? d.fileName.slice(0, 8) + "..." : d.fileName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Mobile: download button at bottom */}
        {objectUrl && (
          <div className="sm:hidden border-t border-gray-200 bg-gray-50 px-3 py-2 flex justify-center">
            <a href={objectUrl} download={doc.originalFileName}
              className="px-4 py-2 text-xs font-medium text-white bg-arcadia-600 hover:bg-arcadia-700 rounded-lg transition w-full text-center">
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Upload queue item ─── */
interface FileQueueItem {
  id: string;
  file: File;
  displayName: string;
  status: "pending" | "uploading" | "processing" | "done" | "error" | "cancelled";
  progress: number;
  loaded: number;
  error?: string;
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function ProjectDocumentsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Folder state
  const [folderTree, setFolderTree] = useState<FolderDto[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Multi-file upload queue
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const uploadHandleRef = useRef<UploadHandle | null>(null);
  const cancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk selection
  const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());

  // Viewer
  const [viewingDoc, setViewingDoc] = useState<DocumentDto | null>(null);
  const [viewerDocList, setViewerDocList] = useState<DocumentDto[]>([]); // docs available in viewer navigation

  // Current user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentDto[]>([]);
  const [searching, setSearching] = useState(false);

  // Mobile: collapsible folder panel
  const [showFolderPanel, setShowFolderPanel] = useState(false);


  useEffect(() => {
    projectService.getActiveProjects().then(setProjects).catch(() => setError("Failed to load projects."));
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  // Debounced Search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await documentService.search(q);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);


  const isAdminOrPartner = currentUser ? currentUser.roles.some((r) => r.name === "ADMIN" || r.name === "PARTNER") : false;
  const currentEmail = currentUser?.email || "";

  /** Check if the current user can delete a specific document */
  function canDelete(doc: DocumentDto): boolean {
    // Admin/Partner can delete any document
    if (isAdminOrPartner) return true;
    // Regular users can only delete their own uploads
    return doc.uploadedBy === currentEmail;
  }

  /* ─── Load folder tree ─── */
  const loadFolders = useCallback(async (proj: string) => {
    if (!proj) { setFolderTree([]); return; }
    try {
      const tree = await folderService.getTree(proj);
      setFolderTree(tree);
    } catch {
      // silent — folders are optional
    }
  }, []);

  /* ─── Load documents for current folder ─── */
  const loadDocuments = useCallback(async (proj: string, folderId: number | null) => {
    if (!proj) { setDocuments([]); return; }
    setLoadingDocs(true);
    setError("");
    try {
      const docs = await documentService.listByProject(proj, folderId);
      setDocuments(docs);
      setSelectedDocIds(new Set());
    } catch {
      setError("Failed to load documents.");
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  /* ─── Build breadcrumb ─── */
  const buildBreadcrumb = useCallback(async (folderId: number | null, projectName: string) => {
    const root: BreadcrumbItem = { id: null, name: projectName };
    if (folderId == null) {
      setBreadcrumb([root]);
      return;
    }
    try {
      const path = await folderService.getBreadcrumb(folderId);
      setBreadcrumb([root, ...path.map((f) => ({ id: f.id, name: f.name }))]);
    } catch {
      setBreadcrumb([root]);
    }
  }, []);

  // When project changes
  useEffect(() => {
    setCurrentFolderId(null);
    setBreadcrumb([]);
    setExpandedIds(new Set());
    if (selectedProject) {
      loadFolders(selectedProject);
      loadDocuments(selectedProject, null);
      buildBreadcrumb(null, selectedProject);
    } else {
      setFolderTree([]);
      setDocuments([]);
    }
  }, [selectedProject, loadFolders, loadDocuments, buildBreadcrumb]);

  // When folder changes
  useEffect(() => {
    if (selectedProject) {
      loadDocuments(selectedProject, currentFolderId);
      buildBreadcrumb(currentFolderId, selectedProject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  /* ─── Folder navigation ─── */
  function navigateToFolder(folderId: number | null) {
    setCurrentFolderId(folderId);
    setUploadMsg("");
    setUploadError("");
    setSelectedDocIds(new Set());
  }

  function handleFolderSelect(folderId: number) {
    navigateToFolder(folderId);
    // Auto-expand the selected folder
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
  }

  function toggleExpand(folderId: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  /* ─── Folder CRUD ─── */
  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      await folderService.create(selectedProject, newFolderName.trim(), currentFolderId);
      setNewFolderName("");
      setShowFolderInput(false);
      await loadFolders(selectedProject);
      // Expand current folder to show the new one
      if (currentFolderId != null) {
        setExpandedIds((prev) => new Set(prev).add(currentFolderId));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create folder.");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleRenameFolder() {
    if (!renameValue.trim() || renamingFolderId == null) return;
    try {
      await folderService.rename(renamingFolderId, renameValue.trim());
      setRenamingFolderId(null);
      setRenameValue("");
      await loadFolders(selectedProject);
      if (currentFolderId != null) buildBreadcrumb(currentFolderId, selectedProject);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to rename folder.");
    }
  }

  async function handleDeleteFolder(folderId: number, folderName: string) {
    if (!confirm(`Delete folder "${folderName}" and all its contents?\n\nThis cannot be undone.`)) return;
    try {
      await folderService.delete(folderId);
      if (currentFolderId === folderId) setCurrentFolderId(null);
      await loadFolders(selectedProject);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to delete folder.");
    }
  }

  /* ─── Compute folder depth for "New Folder" button visibility ─── */
  function getCurrentDepth(): number {
    if (currentFolderId == null) return 0;
    return breadcrumb.length - 1; // root doesn't count
  }

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "image/png",
    "image/jpeg",
  ];

  /* ─── Files selected (multiple) ─── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadMsg("");
    setUploadError("");
    const newItems: FileQueueItem[] = [];
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_TYPES.includes(file.type)) { errors.push(`"${file.name}" — type not allowed`); continue; }
      if (file.size > 100 * 1024 * 1024) { errors.push(`"${file.name}" — exceeds 100 MB`); continue; }
      newItems.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        file, displayName: file.name.replace(/\.[^/.]+$/, ""),
        status: "pending", progress: 0, loaded: 0,
      });
    }
    if (errors.length > 0) setUploadError("Skipped: " + errors.join("; "));
    setFileQueue((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateQueueItem(id: string, patch: Partial<FileQueueItem>) {
    setFileQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
  function removeFromQueue(id: string) { setFileQueue((prev) => prev.filter((item) => item.id !== id)); }
  function updateDisplayName(id: string, name: string) { updateQueueItem(id, { displayName: name }); }

  /* ─── Upload all files sequentially into current folder ─── */
  async function handleUploadAll() {
    if (!selectedProject) return setUploadError("Please select a project first.");
    const pending = fileQueue.filter((f) => f.status === "pending");
    if (pending.length === 0) return setUploadError("No files to upload.");

    setUploading(true);
    setUploadError("");
    setUploadMsg("");
    cancelledRef.current = false;
    let successCount = 0, failCount = 0;

    for (const item of pending) {
      if (cancelledRef.current) { updateQueueItem(item.id, { status: "cancelled" }); continue; }
      updateQueueItem(item.id, { status: "uploading", progress: 0, loaded: 0 });

      const handle = documentService.uploadWithProgress(
        selectedProject, item.file,
        (loaded, total) => {
          const pct = Math.round((loaded / total) * 100);
          updateQueueItem(item.id, { progress: pct, loaded, status: pct >= 100 ? "processing" : "uploading" });
        },
        item.displayName,
        currentFolderId
      );
      uploadHandleRef.current = handle;

      try {
        await handle.promise;
        updateQueueItem(item.id, { status: "done", progress: 100 });
        successCount++;
      } catch (err: any) {
        if (err.message === "Upload cancelled") {
          updateQueueItem(item.id, { status: "cancelled", error: "Cancelled" });
          cancelledRef.current = true;
        } else {
          updateQueueItem(item.id, { status: "error", error: err.message || "Upload failed" });
          failCount++;
        }
      }
    }

    uploadHandleRef.current = null;
    setUploading(false);
    await loadDocuments(selectedProject, currentFolderId);

    const parts: string[] = [];
    if (successCount > 0) parts.push(`${successCount} file${successCount > 1 ? "s" : ""} uploaded`);
    if (failCount > 0) parts.push(`${failCount} failed`);
    if (cancelledRef.current) parts.push("upload cancelled");
    if (parts.length > 0) setUploadMsg(parts.join(", ") + ".");

    setTimeout(() => { setFileQueue((prev) => prev.filter((f) => f.status !== "done")); }, 3000);
  }

  function handleCancelUpload() {
    cancelledRef.current = true;
    if (uploadHandleRef.current) uploadHandleRef.current.abort();
  }
  function handleClearQueue() {
    if (!uploading) { setFileQueue([]); setUploadMsg(""); setUploadError(""); }
  }

  /* ─── Delete document ─── */
  async function handleDelete(doc: DocumentDto) {
    if (!confirm(`Are you sure you want to delete "${doc.fileName}"?\n\nThis cannot be undone.`)) return;
    try {
      await documentService.delete(doc.id);
      await loadDocuments(selectedProject, currentFolderId);
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  }

  /* ─── Bulk delete documents ─── */
  function toggleDocSelection(docId: number) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedDocIds.size === documents.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(documents.map((d) => d.id)));
    }
  }

  async function handleBulkDelete() {
    if (selectedDocIds.size === 0) return;
    if (!confirm(`Delete ${selectedDocIds.size} selected document(s)?\n\nThis cannot be undone.`)) return;
    try {
      await documentService.bulkDelete(Array.from(selectedDocIds));
      setSelectedDocIds(new Set());
      await loadDocuments(selectedProject, currentFolderId);
    } catch (err: any) {
      setError(err.response?.data?.error || "Bulk delete failed.");
    }
  }

  /* ─── View helpers ─── */
  function openViewer(doc: DocumentDto, docList: DocumentDto[]) {
    setViewerDocList(docList);
    setViewingDoc(doc);
  }

  function handleViewSelected() {
    if (selectedDocIds.size === 0) return;
    const selected = documents.filter((d) => selectedDocIds.has(d.id));
    if (selected.length > 0) openViewer(selected[0], selected);
  }

  /* ─── Find sub-folders at current level (for display in documents list) ─── */
  function getSubFolders(): FolderDto[] {
    if (currentFolderId == null) return folderTree;
    function findFolder(nodes: FolderDto[], id: number): FolderDto | null {
      for (const n of nodes) {
        if (n.id === id) return n;
        const found = findFolder(n.children || [], id);
        if (found) return found;
      }
      return null;
    }
    const folder = findFolder(folderTree, currentFolderId);
    return folder?.children || [];
  }

  const subFolders = getSubFolders();

  /* ═══ RENDER ═══ */
  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <h1 className="text-lg sm:text-2xl font-bold text-arcadia-800">Project Documents</h1>

      {/* ── Global Search Bar ── */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <span className="text-gray-400 group-focus-within:text-arcadia-600 transition-colors text-lg">
            🔍
          </span>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents by name across all projects..."
          className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-arcadia-500/10 focus:border-arcadia-500 outline-none transition-all text-sm placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        )}

        {/* Search Results Dropdown/Overlay */}
        {searchQuery.trim().length >= 2 && (
          <div className="absolute z-[60] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[400px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {searching ? "Searching..." : `Results for "${searchQuery}"`}
              </span>
              <span className="text-[10px] text-gray-400">
                {searchResults.length} {searchResults.length === 1 ? "document" : "documents"} found
              </span>
            </div>
            <div className="overflow-y-auto py-1">
              {searching && searchResults.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600 mx-auto mb-2" />
                  Searching files...
                </div>
              )}
              {!searching && searchResults.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-400 italic text-sm">
                  No documents matching your search.
                </div>
              )}
              {searchResults.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    openViewer(doc, searchResults);
                    setSearchQuery("");
                  }}
                  className="px-4 py-3 hover:bg-arcadia-50 cursor-pointer flex items-center gap-3 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl group-hover:bg-white group-hover:shadow-sm transition">
                    {fileIcon(doc.contentType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-800 truncate group-hover:text-arcadia-700">
                      {doc.fileName}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2">
                      <span className="font-medium text-arcadia-600">{doc.projectName}</span>
                      <span className="text-gray-300">|</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span className="text-gray-300">|</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition pr-2">
                    <span className="text-arcadia-600 text-xs font-semibold">View &rsaquo;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (

        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* ── Project Selector ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-5">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Select Project</label>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500">
          <option value="">-- Choose a project --</option>
          {projects.map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
        </select>
      </div>

      {selectedProject && (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* ══════ LEFT: Folder Tree Panel (collapsible on mobile) ══════ */}
          <div className="w-full lg:w-64 lg:flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <button className="text-sm font-semibold text-gray-700 flex items-center gap-2 lg:cursor-default"
                onClick={() => setShowFolderPanel(!showFolderPanel)}>
                <span className="lg:hidden text-gray-400">{showFolderPanel ? "▾" : "▸"}</span>
                Folders
                <span className="lg:hidden text-xs text-gray-400 font-normal">
                  {breadcrumb.length > 1 ? `(${breadcrumb[breadcrumb.length - 1].name})` : "(Root)"}
                </span>
              </button>
              {getCurrentDepth() < 3 && (
                <button
                  onClick={() => { setShowFolderInput(!showFolderInput); setNewFolderName(""); setShowFolderPanel(true); }}
                  className="text-xs text-arcadia-600 hover:text-arcadia-800 font-medium"
                  title="New Folder"
                >
                  + New
                </button>
              )}
            </div>

            {/* New folder input */}
            {showFolderInput && (
              <div className="px-3 py-2 border-b border-gray-100 bg-yellow-50">
                <p className="text-[10px] text-gray-500 mb-1">
                  Creating in: {breadcrumb.map((b) => b.name).join(" / ")}
                </p>
                <div className="flex gap-1">
                  <input
                    type="text" value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                    placeholder="Folder name"
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-arcadia-500"
                    autoFocus
                  />
                  <button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}
                    className="px-2 py-1 text-xs bg-arcadia-600 text-white rounded hover:bg-arcadia-700 disabled:opacity-50">
                    {creatingFolder ? "..." : "Add"}
                  </button>
                  <button onClick={() => setShowFolderInput(false)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">
                    &times;
                  </button>
                </div>
              </div>
            )}

            {/* Folder tree — always visible on desktop, toggled on mobile */}
            <div className={`p-2 max-h-96 overflow-y-auto always-scroll ${showFolderPanel ? "block" : "hidden lg:block"}`}>
              {/* Root item */}
              <div
                className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer text-sm transition
                  ${currentFolderId === null ? "bg-arcadia-100 text-arcadia-800 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}
                onClick={() => { navigateToFolder(null); setShowFolderPanel(false); }}
              >
                <span className="w-4 flex-shrink-0" />
                <span className="flex-shrink-0">{"\u{1F3E0}"}</span>
                <span className="truncate">{selectedProject} (Root)</span>
              </div>

              {/* Folder tree */}
              {folderTree.map((folder) => (
                <FolderTreeNode
                  key={folder.id}
                  folder={folder}
                  depth={1}
                  selectedFolderId={currentFolderId}
                  onSelect={(id) => { handleFolderSelect(id); setShowFolderPanel(false); }}
                  expandedIds={expandedIds}
                  onToggle={toggleExpand}
                />
              ))}

              {folderTree.length === 0 && (
                <p className="text-xs text-gray-400 px-2 py-3 text-center">No folders yet</p>
              )}
            </div>
          </div>

          {/* ══════ RIGHT: Main Content ══════ */}
          <div className="flex-1 space-y-4 lg:space-y-5 min-w-0">
            {/* ── Breadcrumb ── */}
            <div className="flex items-center gap-1 text-xs sm:text-sm flex-wrap">
              {breadcrumb.map((item, i) => (
                <span key={item.id ?? "root"} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => navigateToFolder(item.id)}
                    className={`hover:text-arcadia-700 transition ${
                      i === breadcrumb.length - 1
                        ? "text-arcadia-800 font-semibold"
                        : "text-gray-500 hover:underline"
                    }`}
                  >
                    {i === 0 ? "\u{1F3E0} " : "\u{1F4C1} "}{item.name}
                  </button>
                </span>
              ))}
            </div>

            {/* ── Sub-folders in current view ── */}
            {subFolders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {subFolders.map((folder) => (
                  <div key={folder.id}
                    className="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-3 hover:border-arcadia-300 hover:shadow-sm cursor-pointer transition group"
                    onClick={() => handleFolderSelect(folder.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">{"\u{1F4C1}"}</span>
                      {renamingFolderId === folder.id ? (
                        <input
                          type="text" value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(); if (e.key === "Escape") setRenamingFolderId(null); }}
                          onBlur={handleRenameFolder}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-xs sm:text-sm focus:ring-1 focus:ring-arcadia-500"
                          autoFocus
                        />
                      ) : (
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1">{folder.name}</span>
                      )}
                    </div>
                    {/* Folder actions — visible on hover (or always on mobile for touch) */}
                    {isAdminOrPartner && renamingFolderId !== folder.id && (
                      <div className="mt-2 flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setRenamingFolderId(folder.id); setRenameValue(folder.name); }}
                          className="text-[10px] text-gray-500 hover:text-arcadia-600">Rename</button>
                        <button onClick={() => handleDeleteFolder(folder.id, folder.name)}
                          className="text-[10px] text-gray-500 hover:text-red-600">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Upload Section ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-5 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Upload Documents</h2>
                <span className="text-[10px] sm:text-xs text-gray-400 truncate">
                  to: {breadcrumb.map((b) => b.name).join(" / ")}
                </span>
              </div>

              {uploadMsg && (
                <div className="p-2.5 sm:p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs sm:text-sm">{uploadMsg}</div>
              )}
              {uploadError && (
                <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm">{uploadError}</div>
              )}

              <div>
                <input ref={fileInputRef} type="file" multiple
                  accept=".pdf,.docx,.ppt,.pptx,.xlsx,.xls,.png,.jpg,.jpeg"
                  onChange={handleFileChange} disabled={uploading}
                  className="w-full text-xs sm:text-sm text-gray-600 file:mr-2 sm:file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-arcadia-50 file:text-arcadia-700 hover:file:bg-arcadia-100 cursor-pointer disabled:opacity-50"
                />
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                  PDF, DOCX, PPT, PPTX, XLSX, XLS, PNG, JPEG (max 100 MB each).
                </p>
              </div>

              {/* File Queue */}
              {fileQueue.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-600">
                      {fileQueue.length} file{fileQueue.length > 1 ? "s" : ""}
                      {" "}({formatFileSize(fileQueue.reduce((sum, f) => sum + f.file.size, 0))})
                    </p>
                    {!uploading && (
                      <button onClick={handleClearQueue} className="text-xs text-gray-400 hover:text-red-500 transition">Clear All</button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {fileQueue.map((item) => (
                      <div key={item.id} className="px-3 sm:px-4 py-2 sm:py-2.5 space-y-1">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-base sm:text-lg flex-shrink-0">{fileIcon(item.file.type)}</span>
                          <div className="flex-1 min-w-0">
                            {item.status === "pending" ? (
                              <input type="text" value={item.displayName}
                                onChange={(e) => updateDisplayName(item.id, e.target.value)}
                                className="w-full border border-gray-200 rounded px-2 py-1 text-xs sm:text-sm focus:ring-1 focus:ring-arcadia-500" placeholder="Display name" />
                            ) : (
                              <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{item.displayName || item.file.name}</p>
                            )}
                            <p className="text-[10px] sm:text-xs text-gray-400 truncate">{item.file.name} &middot; {formatFileSize(item.file.size)}</p>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
                            {item.status === "done" && <span className="text-[10px] sm:text-xs font-medium text-green-600 bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Done</span>}
                            {item.status === "error" && <span className="text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" title={item.error}>Failed</span>}
                            {item.status === "cancelled" && <span className="text-[10px] sm:text-xs font-medium text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Cancelled</span>}
                            {item.status === "pending" && !uploading && (
                              <button onClick={() => removeFromQueue(item.id)} className="text-gray-400 hover:text-red-500 text-lg leading-none transition" title="Remove">&times;</button>
                            )}
                          </div>
                        </div>
                        {item.status === "uploading" && (
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
                              <div className="bg-arcadia-600 h-full rounded-full transition-all duration-300 flex items-center justify-center" style={{ width: `${item.progress}%` }}>
                                {item.progress > 15 && <span className="text-[8px] sm:text-[9px] font-semibold text-white leading-none">{item.progress}%</span>}
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-500">Uploading: {formatFileSize(item.loaded)} / {formatFileSize(item.file.size)}</p>
                          </div>
                        )}
                        {item.status === "processing" && (
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
                              <div className="bg-green-500 h-full rounded-full w-full animate-pulse flex items-center justify-center">
                                <span className="text-[8px] sm:text-[9px] font-semibold text-white leading-none">Processing...</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-arcadia-600" />
                              <p className="text-[10px] text-gray-500">Saving to server...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {!uploading ? (
                  <button onClick={handleUploadAll}
                    disabled={fileQueue.filter((f) => f.status === "pending").length === 0}
                    className="bg-arcadia-600 text-white px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50">
                    Upload {fileQueue.filter((f) => f.status === "pending").length > 1
                      ? `All (${fileQueue.filter((f) => f.status === "pending").length} files)` : ""}
                  </button>
                ) : (
                  <button onClick={handleCancelUpload}
                    className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition">
                    Cancel All
                  </button>
                )}
              </div>
            </div>

            {/* ── Documents List ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-xs sm:text-sm font-semibold text-gray-700">
                  Documents {currentFolderId ? "" : `(${selectedProject})`}
                </h2>
                {selectedDocIds.size > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleViewSelected}
                      className="text-[10px] sm:text-xs font-medium text-arcadia-600 bg-arcadia-50 hover:bg-arcadia-100 border border-arcadia-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition">
                      View Selected ({selectedDocIds.size})
                    </button>
                    {documents.some((d) => selectedDocIds.has(d.id) && canDelete(d)) && (
                      <button onClick={handleBulkDelete}
                        className="text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition">
                        Delete Selected ({selectedDocIds.size})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {loadingDocs ? (
                <div className="flex items-center gap-2 text-gray-500 py-8 justify-center text-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
                  Loading...
                </div>
              ) : documents.length === 0 && subFolders.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-5xl text-gray-300 mb-3">{"\u{1F4C2}"}</div>
                  <p className="text-gray-500 text-sm">No documents here yet.</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Upload files to get started.</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No documents in this folder.</p>
                </div>
              ) : (
                <>
                  {/* ── Desktop table view (hidden on mobile) ── */}
                  <div className="hidden sm:block overflow-auto max-h-[60vh] always-scroll">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead className="bg-gray-50 border-b sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 whitespace-nowrap w-10">
                            <input type="checkbox"
                              checked={documents.length > 0 && selectedDocIds.size === documents.length}
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500 cursor-pointer" />
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">#</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">File Name</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Type</th>
                          <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Size</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Uploaded By</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Date</th>
                          <th className="text-center px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc, i) => (
                          <tr key={doc.id} className={`border-b hover:bg-gray-50 cursor-pointer ${selectedDocIds.has(doc.id) ? "bg-arcadia-50" : ""}`} onClick={() => openViewer(doc, documents)}>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox"
                                checked={selectedDocIds.has(doc.id)}
                                onChange={() => toggleDocSelection(doc.id)}
                                className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500 cursor-pointer" />
                            </td>
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{fileIcon(doc.contentType)}</span>
                                <div className="min-w-0">
                                  <p className="font-medium text-arcadia-700 truncate max-w-[200px]">{doc.fileName}</p>
                                  {doc.fileName !== doc.originalFileName && (
                                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{doc.originalFileName}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              {doc.contentType === "application/pdf" ? "PDF"
                                : doc.contentType.includes("wordprocessingml") ? "DOCX"
                                : doc.contentType.includes("presentation") || doc.contentType.includes("powerpoint") ? "PPT"
                                : doc.contentType.includes("spreadsheetml") || doc.contentType.includes("ms-excel") ? "XLSX"
                                : doc.contentType === "image/png" ? "PNG" : "JPEG"}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{formatFileSize(doc.fileSize)}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{doc.uploadedBy}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(doc.createdAt)}</td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => openViewer(doc, documents)}
                                  className="text-xs text-arcadia-600 hover:text-arcadia-800 font-medium px-2 py-1 rounded hover:bg-arcadia-50 transition">View</button>
                                {canDelete(doc) && (
                                  <button onClick={() => handleDelete(doc)}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition">Delete</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Mobile card view (hidden on desktop) ── */}
                  <div className="sm:hidden">
                    {/* Select all bar */}
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <input type="checkbox"
                        checked={documents.length > 0 && selectedDocIds.size === documents.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500 cursor-pointer" />
                      <span className="text-[10px] text-gray-500 font-medium">Select All ({documents.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                      {documents.map((doc, i) => (
                        <div key={doc.id}
                          className={`px-3 py-3 flex items-start gap-2.5 active:bg-gray-50 ${selectedDocIds.has(doc.id) ? "bg-arcadia-50" : ""}`}
                          onClick={() => openViewer(doc, documents)}>
                          {/* Checkbox */}
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox"
                              checked={selectedDocIds.has(doc.id)}
                              onChange={() => toggleDocSelection(doc.id)}
                              className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500 cursor-pointer" />
                          </div>
                          {/* Icon */}
                          <span className="text-2xl flex-shrink-0 mt-0.5">{fileIcon(doc.contentType)}</span>
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-arcadia-700 truncate">{doc.fileName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                              <span className="font-medium text-gray-600">
                                {doc.contentType === "application/pdf" ? "PDF"
                                  : doc.contentType.includes("wordprocessingml") ? "DOCX"
                                  : doc.contentType.includes("presentation") || doc.contentType.includes("powerpoint") ? "PPT"
                                  : doc.contentType.includes("spreadsheetml") || doc.contentType.includes("ms-excel") ? "XLSX"
                                  : doc.contentType === "image/png" ? "PNG" : "JPEG"}
                              </span>
                              <span className="text-gray-300">&middot;</span>
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span className="text-gray-300">&middot;</span>
                              <span>{formatDate(doc.createdAt)}</span>
                            </div>
                            {/* Actions row */}
                            <div className="flex items-center gap-3 mt-1.5" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => openViewer(doc, documents)}
                                className="text-[11px] text-arcadia-600 font-semibold">View</button>
                              {canDelete(doc) && (
                                <button onClick={() => handleDelete(doc)}
                                  className="text-[11px] text-red-500 font-semibold">Delete</button>
                              )}
                            </div>
                          </div>
                          {/* Row number */}
                          <span className="text-[10px] text-gray-300 font-medium flex-shrink-0">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── File Viewer Modal ── */}
      {viewingDoc && (
        <FileViewerModal
          doc={viewingDoc}
          allDocs={viewerDocList.length > 0 ? viewerDocList : documents}
          onClose={() => { setViewingDoc(null); setViewerDocList([]); }}
          onNavigate={(d) => setViewingDoc(d)}
        />
      )}
    </div>
  );
}
