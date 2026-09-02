import { useState, useEffect, useRef } from "react";
import {
  personalDocumentService,
  PersonalDocumentDto,
  DOCUMENT_CATEGORIES,
} from "../services/personalDocumentService";

export default function PersonalDocumentsPage() {
  const [docs, setDocs] = useState<PersonalDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("General");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PersonalDocumentDto | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const currentUser = (() => {
    try {
      const t = sessionStorage.getItem("token");
      if (!t) return "";
      const payload = JSON.parse(atob(t.split(".")[1]));
      return payload.sub || "";
    } catch {
      return "";
    }
  })();

  const isAdmin = (() => {
    try {
      const t = sessionStorage.getItem("token");
      if (!t) return false;
      const payload = JSON.parse(atob(t.split(".")[1]));
      const roles: string[] = payload.roles || [];
      return roles.includes("ROLE_ADMIN");
    } catch {
      return false;
    }
  })();

  const load = async () => {
    setLoading(true);
    try {
      const data = await personalDocumentService.list(filterCategory || undefined);
      setDocs(data);
    } catch (e) {
      console.error("Failed to load personal documents", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filterCategory]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await personalDocumentService.upload(file, uploadCategory, uploadDesc || undefined);
      setShowUpload(false);
      setUploadCategory("General");
      setUploadDesc("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) {
      console.error("Upload failed", e);
      alert("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await personalDocumentService.delete(id);
      load();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const openPreview = (doc: PersonalDocumentDto) => {
    const token = sessionStorage.getItem("token") || "";
    const url = `/api/personal-documents/${doc.id}`;
    if (doc.contentType.startsWith("image/") || doc.contentType === "application/pdf") {
      setPreviewDoc(doc);
      // Fetch as blob for preview
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.blob())
        .then((blob) => setPreviewUrl(URL.createObjectURL(blob)));
    } else {
      // Download directly
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.blob())
        .then((blob) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = doc.fileName;
          a.click();
        });
    }
  };

  const handleDownload = (doc: PersonalDocumentDto) => {
    const token = sessionStorage.getItem("token") || "";
    const url = `/api/personal-documents/${doc.id}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = doc.fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewDoc(null);
    setPreviewUrl("");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const getFileIcon = (ct: string) => {
    if (ct.startsWith("image/")) return "🖼️";
    if (ct === "application/pdf") return "📄";
    if (ct.includes("word") || ct.includes("document")) return "📝";
    if (ct.includes("sheet") || ct.includes("excel")) return "📊";
    return "📎";
  };

  // Group docs by category
  const grouped = docs.reduce<Record<string, PersonalDocumentDto[]>>((acc, doc) => {
    const cat = doc.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Personal Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? "View all users' personal documents" : "Upload and manage your personal documents"}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Document
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Filter by Category:</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All Categories</option>
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{docs.length} document(s)</span>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white rounded-t-xl">
              <h3 className="text-lg font-semibold">Upload Personal Document</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Brief description of the document"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                <input
                  type="file"
                  ref={fileRef}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={closePreview}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h3 className="font-semibold text-gray-800 truncate">{previewDoc.fileName}</h3>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {!previewUrl ? (
                <span className="text-gray-400">Loading...</span>
              ) : previewDoc.contentType.startsWith("image/") ? (
                <img src={previewUrl} alt={previewDoc.fileName} className="max-w-full max-h-[70vh] object-contain" />
              ) : previewDoc.contentType === "application/pdf" ? (
                <iframe src={previewUrl} className="w-full h-[70vh]" title={previewDoc.fileName} />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-500">No personal documents found</p>
          <p className="text-sm text-gray-400 mt-1">Click "Upload Document" to add your first document</p>
        </div>
      ) : filterCategory ? (
        /* Flat list when filtering */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Document</th>
                {isAdmin && <th className="px-4 py-3 text-left font-semibold text-gray-700">Uploaded By</th>}
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Size</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileIcon(doc.contentType)}</span>
                      <span className="font-medium text-gray-800 truncate max-w-xs">{doc.fileName}</span>
                    </div>
                  </td>
                  {isAdmin && <td className="px-4 py-3 text-gray-600">{doc.uploadedBy}</td>}
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{doc.description || "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{formatSize(doc.fileSize)}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{formatDate(doc.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openPreview(doc)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View</button>
                      <button onClick={() => handleDownload(doc)} className="text-green-600 hover:text-green-800 text-xs font-medium">Download</button>
                      {(isAdmin || doc.uploadedBy === currentUser) && (
                        <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grouped by category */
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, catDocs]) => (
              <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">{cat}</h3>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{catDocs.length}</span>
                </div>
                <div className="divide-y">
                  {catDocs.map((doc) => (
                    <div key={doc.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                      <span className="text-lg flex-shrink-0">{getFileIcon(doc.contentType)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{doc.fileName}</div>
                        <div className="text-xs text-gray-400">
                          {formatSize(doc.fileSize)} · {formatDate(doc.createdAt)}
                          {isAdmin && doc.uploadedBy !== currentUser && <span className="ml-2 text-blue-500">by {doc.uploadedBy}</span>}
                          {doc.description && <span className="ml-2">— {doc.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => openPreview(doc)} className="px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                          View
                        </button>
                        <button onClick={() => handleDownload(doc)} className="px-3 py-1 text-xs text-green-600 border border-green-200 rounded-lg hover:bg-green-50">
                          Download
                        </button>
                        {(isAdmin || doc.uploadedBy === currentUser) && (
                          <button onClick={() => handleDelete(doc.id)} className="px-3 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
