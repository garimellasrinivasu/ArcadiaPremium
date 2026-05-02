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

/* ─── File Viewer Modal ─── */
function FileViewerModal({ doc, onClose }: { doc: DocumentDto; onClose: () => void }) {
  const token = sessionStorage.getItem("token") || "";
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isImage = doc.contentType.startsWith("image/");
  const isPdf = doc.contentType === "application/pdf";
  const isDocx = doc.contentType.includes("wordprocessingml");
  const isPpt = doc.contentType.includes("presentation") || doc.contentType.includes("powerpoint");
  const isOfficeDoc = isDocx || isPpt;

  useEffect(() => {
    let cancelled = false;
    async function loadFile() {
      try {
        const res = await fetch(documentService.getViewUrl(doc.id), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load file");
        const blob = await res.blob();
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
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

  useEffect(() => {
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [objectUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{doc.fileName}</h3>
            <p className="text-xs text-gray-400">{formatFileSize(doc.fileSize)} &middot; {doc.originalFileName}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {objectUrl && (
              <a href={objectUrl} download={doc.originalFileName}
                className="px-3 py-1.5 text-xs font-medium text-arcadia-700 bg-arcadia-50 hover:bg-arcadia-100 rounded-lg transition">
                Download
              </a>
            )}
            <button onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition text-lg leading-none">
              &times;
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-4">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
              Loading file...
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!loading && !error && isPdf && objectUrl && (
            <iframe src={objectUrl} title={doc.fileName} className="w-full h-full min-h-[70vh] rounded-lg border" />
          )}
          {!loading && !error && isImage && objectUrl && (
            <img src={objectUrl} alt={doc.fileName} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow" />
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
        </div>
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

  // Viewer
  const [viewingDoc, setViewingDoc] = useState<DocumentDto | null>(null);

  // Current user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    projectService.getActiveProjects().then(setProjects).catch(() => setError("Failed to load projects."));
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser ? currentUser.roles.some((r) => r.name === "ADMIN") : false;

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
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-arcadia-800">Project Documents</h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* ── Project Selector ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500">
          <option value="">-- Choose a project --</option>
          {projects.map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
        </select>
      </div>

      {selectedProject && (
        <div className="flex gap-5">
          {/* ══════ LEFT: Folder Tree Panel ══════ */}
          <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Folders</h3>
              {getCurrentDepth() < 3 && (
                <button
                  onClick={() => { setShowFolderInput(!showFolderInput); setNewFolderName(""); }}
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

            <div className="p-2 max-h-96 overflow-y-auto">
              {/* Root item */}
              <div
                className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer text-sm transition
                  ${currentFolderId === null ? "bg-arcadia-100 text-arcadia-800 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}
                onClick={() => navigateToFolder(null)}
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
                  onSelect={handleFolderSelect}
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
          <div className="flex-1 space-y-5 min-w-0">
            {/* ── Breadcrumb ── */}
            <div className="flex items-center gap-1 text-sm flex-wrap">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {subFolders.map((folder) => (
                  <div key={folder.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-arcadia-300 hover:shadow-sm cursor-pointer transition group"
                    onClick={() => handleFolderSelect(folder.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{"\u{1F4C1}"}</span>
                      {renamingFolderId === folder.id ? (
                        <input
                          type="text" value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(); if (e.key === "Escape") setRenamingFolderId(null); }}
                          onBlur={handleRenameFolder}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-sm focus:ring-1 focus:ring-arcadia-500"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-700 truncate flex-1">{folder.name}</span>
                      )}
                    </div>
                    {/* Folder actions — visible on hover */}
                    {isAdmin && renamingFolderId !== folder.id && (
                      <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Upload Documents</h2>
                <span className="text-xs text-gray-400">
                  to: {breadcrumb.map((b) => b.name).join(" / ")}
                </span>
              </div>

              {uploadMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{uploadMsg}</div>
              )}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{uploadError}</div>
              )}

              <div>
                <input ref={fileInputRef} type="file" multiple
                  accept=".pdf,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  onChange={handleFileChange} disabled={uploading}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-arcadia-50 file:text-arcadia-700 hover:file:bg-arcadia-100 cursor-pointer disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">
                  PDF, DOCX, PPT, PPTX, PNG, JPEG (max 100 MB each). Select multiple files.
                </p>
              </div>

              {/* File Queue */}
              {fileQueue.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
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
                      <div key={item.id} className="px-4 py-2.5 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg flex-shrink-0">{fileIcon(item.file.type)}</span>
                          <div className="flex-1 min-w-0">
                            {item.status === "pending" ? (
                              <input type="text" value={item.displayName}
                                onChange={(e) => updateDisplayName(item.id, e.target.value)}
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-arcadia-500" placeholder="Display name" />
                            ) : (
                              <p className="text-sm font-medium text-gray-700 truncate">{item.displayName || item.file.name}</p>
                            )}
                            <p className="text-xs text-gray-400">{item.file.name} &middot; {formatFileSize(item.file.size)}</p>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {item.status === "done" && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Done</span>}
                            {item.status === "error" && <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded" title={item.error}>Failed</span>}
                            {item.status === "cancelled" && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Cancelled</span>}
                            {item.status === "pending" && !uploading && (
                              <button onClick={() => removeFromQueue(item.id)} className="text-gray-400 hover:text-red-500 text-lg leading-none transition" title="Remove">&times;</button>
                            )}
                          </div>
                        </div>
                        {item.status === "uploading" && (
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div className="bg-arcadia-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center" style={{ width: `${item.progress}%` }}>
                                {item.progress > 15 && <span className="text-[9px] font-semibold text-white leading-none">{item.progress}%</span>}
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-500">Uploading: {formatFileSize(item.loaded)} / {formatFileSize(item.file.size)}</p>
                          </div>
                        )}
                        {item.status === "processing" && (
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div className="bg-green-500 h-3 rounded-full w-full animate-pulse flex items-center justify-center">
                                <span className="text-[9px] font-semibold text-white leading-none">Processing...</span>
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
                    className="bg-arcadia-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50">
                    Upload {fileQueue.filter((f) => f.status === "pending").length > 1
                      ? `All (${fileQueue.filter((f) => f.status === "pending").length} files)` : ""}
                  </button>
                ) : (
                  <button onClick={handleCancelUpload}
                    className="px-5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition">
                    Cancel All
                  </button>
                )}
              </div>
            </div>

            {/* ── Documents List ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">
                  Documents {currentFolderId ? "" : `in "${selectedProject}" (Root)`}
                </h2>
              </div>

              {loadingDocs ? (
                <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
                  Loading...
                </div>
              ) : documents.length === 0 && subFolders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl text-gray-300 mb-3">{"\u{1F4C2}"}</div>
                  <p className="text-gray-500">No documents here yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Upload files or create a folder to get started.</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No documents in this folder.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">File Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Type</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Size</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Uploaded By</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Date</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, i) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setViewingDoc(doc)}>
                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{fileIcon(doc.contentType)}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-arcadia-700 truncate">{doc.fileName}</p>
                              {doc.fileName !== doc.originalFileName && (
                                <p className="text-xs text-gray-400 truncate">{doc.originalFileName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {doc.contentType === "application/pdf" ? "PDF"
                            : doc.contentType.includes("wordprocessingml") ? "DOCX"
                            : doc.contentType.includes("presentation") || doc.contentType.includes("powerpoint") ? "PPT"
                            : doc.contentType === "image/png" ? "PNG" : "JPEG"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatFileSize(doc.fileSize)}</td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{doc.uploadedBy}</td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell whitespace-nowrap">{formatDate(doc.createdAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setViewingDoc(doc)}
                              className="text-xs text-arcadia-600 hover:text-arcadia-800 font-medium px-2 py-1 rounded hover:bg-arcadia-50 transition">View</button>
                            {isAdmin && (
                              <button onClick={() => handleDelete(doc)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── File Viewer Modal ── */}
      {viewingDoc && <FileViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
