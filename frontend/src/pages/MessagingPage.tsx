import { useState, useEffect, useRef } from "react";
import { userService } from "../services/userService";
import { documentService } from "../services/documentService";
import type { User } from "../types/user";

export default function MessagingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attachment states
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      const usersWithPhone = data.filter(u => u.phone && u.phone.trim().length > 0);
      setUsers(usersWithPhone);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
      // Reset input so the same file can be selected again if removed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!selectedUser || !selectedUser.phone) return;

    let phone = selectedUser.phone.replace(/[\+\-\s]/g, "");

    if (phone.length <= 10) {
      alert("Warning: The selected phone number might not include a country code. Please update the user's phone number to include a country code (e.g., +91) for WhatsApp messaging to work reliably.");
      return;
    }

    let finalMessage = message;

    // Handle attachment uploads if present
    if (attachments.length > 0) {
      try {
        setIsUploading(true);
        setUploadProgress(0);

        const links: string[] = [];
        
        // Upload files sequentially for better progress tracking
        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];
          
          const { promise } = documentService.uploadWithProgress(
            "MESSAGING",
            file,
            (loaded, total) => {
              // Aggregate progress: (completed files + current file progress) / total files
              const currentFileProgress = (loaded / total) * 100;
              const aggregateProgress = Math.round(((i * 100) + currentFileProgress) / attachments.length);
              setUploadProgress(aggregateProgress);
            }
          );

          const doc = await promise;
          const token = await documentService.createShareToken(doc.id);
          const publicUrl = documentService.getPublicUrl(token);
          links.push(`${file.name}: ${publicUrl}`);
        }

        const attachmentSection = `\n\nAttachments:\n${links.join("\n")}`;
        finalMessage += attachmentSection;

      } catch (err: any) {
        alert("Failed to upload attachments: " + (err.message || "Unknown error"));
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const encodedMessage = encodeURIComponent(finalMessage);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Messaging</h1>
          <p className="mt-1 text-sm text-gray-500">Send direct WhatsApp messages with multiple attachments</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
            <select
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const user = users.find(u => u.id === parseInt(e.target.value));
                setSelectedUser(user || null);
              }}
              disabled={loading || isUploading}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-arcadia-500 focus:ring-arcadia-500 text-sm py-2 px-3 border"
            >
              <option value="">-- Select a user --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Type your message here..."
              disabled={isUploading}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-arcadia-500 focus:ring-arcadia-500 text-sm py-2 px-3 border"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Attachments (Optional)</label>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
                multiple
                className="hidden"
                id="messaging-file-upload"
              />
              <label
                htmlFor="messaging-file-upload"
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition ${
                  isUploading ? "bg-gray-100 text-gray-400 border-gray-200" : "hover:bg-gray-50 border-gray-300 text-gray-700"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/>
                </svg>
                Add Files
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center gap-2 bg-arcadia-50 text-arcadia-700 px-3 py-1.5 rounded-lg text-sm border border-arcadia-100 animate-in fade-in zoom-in duration-200">
                    <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      disabled={isUploading}
                      className="text-arcadia-500 hover:text-arcadia-700 font-bold ml-1 focus:outline-none"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-arcadia-600 h-1.5 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Recipient: <span className="font-semibold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</span> ({selectedUser.phone})
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={!selectedUser || (message.trim() === "" && attachments.length === 0) || isUploading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  Send to WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
