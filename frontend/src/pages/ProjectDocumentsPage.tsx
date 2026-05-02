import { useState, useEffect, useCallback, useRef } from "react";
import { projectService, type ProjectDto } from "../services/projectService";
import { documentService, type DocumentDto, type UploadHandle } from "../services/documentService";
import { authService } from "../services/authService";
import type { User } from "../types/user";

/* ─── helpers ─── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function fileIcon(contentType: string): string {
  if (contentType === "application/pdf") return "\u{1F4C4}"; // page facing up
  if (contentType.startsWith("image/")) return "\u{1F5BC}"; // framed picture
  if (contentType.includes("wordprocessingml")) return "\u{1F4DD}"; // memo
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "\u{1F4CA}"; // bar chart
  return "\u{1F4CE}"; // paperclip
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── File Viewer Modal ─── */
function FileViewerModal({
  doc,
  onClose,
}: {
  doc: DocumentDto;
  onClose: () => void;
}) {
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

          // For Office docs (PPT/DOCX), auto-open in a new tab so the
          // device's native app or browser download handler picks it up
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {doc.fileName}
            </h3>
            <p className="text-xs text-gray-400">
              {formatFileSize(doc.fileSize)} &middot; {doc.originalFileName}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {objectUrl && (
              <a
                href={objectUrl}
                download={doc.originalFileName}
                className="px-3 py-1.5 text-xs font-medium text-arcadia-700 bg-arcadia-50 hover:bg-arcadia-100 rounded-lg transition"
              >
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-4">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
              Loading file...
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* PDF viewer */}
          {!loading && !error && isPdf && objectUrl && (
            <iframe
              src={objectUrl}
              title={doc.fileName}
              className="w-full h-full min-h-[70vh] rounded-lg border"
            />
          )}

          {/* Image viewer */}
          {!loading && !error && isImage && objectUrl && (
            <img
              src={objectUrl}
              alt={doc.fileName}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow"
            />
          )}

          {/* Office docs — auto-downloaded, show confirmation */}
          {!loading && !error && isOfficeDoc && objectUrl && (
            <div className="text-center space-y-4 py-12">
              <div className="text-6xl">{fileIcon(doc.contentType)}</div>
              <p className="text-gray-700 font-medium">
                File downloaded successfully!
              </p>
              <p className="text-gray-500 text-sm">
                "{doc.originalFileName}" has been downloaded.<br />
                Open it with {isPpt ? "PowerPoint" : "Word"} on your device.
              </p>
              <a
                href={objectUrl}
                download={doc.originalFileName}
                className="inline-block px-5 py-2.5 bg-arcadia-600 text-white font-medium rounded-lg hover:bg-arcadia-700 transition"
              >
                Download Again
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function ProjectDocumentsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Upload form
  const [customFileName, setCustomFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [uploadLoaded, setUploadLoaded] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const uploadHandleRef = useRef<UploadHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer
  const [viewingDoc, setViewingDoc] = useState<DocumentDto | null>(null);

  // Current user (for admin check)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Error
  const [error, setError] = useState("");

  useEffect(() => {
    projectService
      .getActiveProjects()
      .then(setProjects)
      .catch(() => setError("Failed to load projects."));
    authService
      .getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  const isAdmin = currentUser
    ? currentUser.roles.some((r) => r.name === "ADMIN")
    : false;

  const loadDocuments = useCallback(
    async (proj: string) => {
      if (!proj) {
        setDocuments([]);
        return;
      }
      setLoadingDocs(true);
      setError("");
      try {
        const docs = await documentService.listByProject(proj);
        setDocuments(docs);
      } catch {
        setError("Failed to load documents.");
      } finally {
        setLoadingDocs(false);
      }
    },
    []
  );

  // Reload when project changes
  useEffect(() => {
    loadDocuments(selectedProject);
  }, [selectedProject, loadDocuments]);

  /* ─── File selected ─── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadMsg("");
    setUploadError("");
    // Pre-fill the custom name with the file name (without extension)
    if (file && !customFileName) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setCustomFileName(nameWithoutExt);
    }
  }

  /* ─── Upload ─── */
  async function handleUpload() {
    if (!selectedProject) return setUploadError("Please select a project first.");
    if (!selectedFile) return setUploadError("Please choose a file to upload.");

    // Validate type client-side
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/png",
      "image/jpeg",
    ];
    if (!allowed.includes(selectedFile.type)) {
      return setUploadError("Only PDF, DOCX, PPT, PPTX, PNG, and JPEG files are allowed.");
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      return setUploadError("File size exceeds 100 MB limit.");
    }

    setUploading(true);
    setUploadError("");
    setUploadMsg("");
    setUploadProgress(0);
    setUploadLoaded(0);
    setUploadTotal(selectedFile.size);

    const handle = documentService.uploadWithProgress(
      selectedProject,
      selectedFile,
      (loaded, total) => {
        setUploadLoaded(loaded);
        setUploadTotal(total);
        setUploadProgress(Math.round((loaded / total) * 100));
      },
      customFileName
    );
    uploadHandleRef.current = handle;

    try {
      await handle.promise;
      setUploadMsg(
        `"${customFileName || selectedFile.name}" uploaded successfully (${formatFileSize(selectedFile.size)})`
      );
      setSelectedFile(null);
      setCustomFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments(selectedProject);
    } catch (err: any) {
      if (err.message === "Upload cancelled") {
        setUploadError("Upload cancelled.");
      } else {
        setUploadError(err.message || "Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      uploadHandleRef.current = null;
    }
  }

  /* ─── Cancel Upload ─── */
  function handleCancelUpload() {
    if (uploadHandleRef.current) {
      uploadHandleRef.current.abort();
    }
  }

  /* ─── Delete ─── */
  async function handleDelete(doc: DocumentDto) {
    if (
      !confirm(
        `Are you sure you want to delete "${doc.fileName}"?\n\nThis cannot be undone.`
      )
    )
      return;
    try {
      await documentService.delete(doc.id);
      await loadDocuments(selectedProject);
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  }

  /* ═══ RENDER ═══ */
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-arcadia-800">
        Project Documents
      </h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button
            onClick={() => setError("")}
            className="float-right text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── Project Selector ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Project
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
        >
          <option value="">-- Choose a project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Upload Section ── */}
      {selectedProject && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Upload Document
          </h2>

          {uploadMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {uploadMsg}
            </div>
          )}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose File *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-arcadia-50 file:text-arcadia-700 hover:file:bg-arcadia-100 cursor-pointer"
              />
              <p className="text-xs text-gray-400 mt-1">
                Allowed: PDF, DOCX, PPT, PPTX, PNG, JPEG (max 100 MB)
              </p>
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1">
                  Size: {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>

            {/* Custom name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="Enter a name or leave blank for original"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
              />
            </div>
          </div>

          {/* Upload button OR progress bar */}
          {!uploading ? (
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="bg-arcadia-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50"
            >
              Upload
            </button>
          ) : (
            <div className="space-y-2">
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-arcadia-600 h-4 rounded-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${uploadProgress}%` }}
                >
                  {uploadProgress > 10 && (
                    <span className="text-[10px] font-semibold text-white leading-none">
                      {uploadProgress}%
                    </span>
                  )}
                </div>
              </div>

              {/* Size info and cancel */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  {formatFileSize(uploadLoaded)} / {formatFileSize(uploadTotal)}{" "}
                  <span className="text-gray-400">({uploadProgress}%)</span>
                </p>
                <button
                  onClick={handleCancelUpload}
                  className="px-4 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                >
                  Cancel Upload
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Documents List ── */}
      {selectedProject && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Documents for "{selectedProject}"
            </h2>
          </div>

          {loadingDocs ? (
            <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl text-gray-300 mb-3">{"\u{1F4C2}"}</div>
              <p className="text-gray-500">No documents uploaded yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Use the form above to upload your first document.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    #
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    File Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                    Type
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">
                    Size
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                    Uploaded By
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                    Date
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr
                    key={doc.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setViewingDoc(doc)}
                  >
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {fileIcon(doc.contentType)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-arcadia-700 truncate">
                            {doc.fileName}
                          </p>
                          {doc.fileName !== doc.originalFileName && (
                            <p className="text-xs text-gray-400 truncate">
                              {doc.originalFileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {doc.contentType === "application/pdf"
                        ? "PDF"
                        : doc.contentType.includes("wordprocessingml")
                        ? "DOCX"
                        : doc.contentType.includes("presentation") || doc.contentType.includes("powerpoint")
                        ? "PPT"
                        : doc.contentType === "image/png"
                        ? "PNG"
                        : "JPEG"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell whitespace-nowrap">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div
                        className="flex gap-2 justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="text-xs text-arcadia-600 hover:text-arcadia-800 font-medium px-2 py-1 rounded hover:bg-arcadia-50 transition"
                        >
                          View
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(doc)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── File Viewer Modal ── */}
      {viewingDoc && (
        <FileViewerModal
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}
