import { useState, useEffect } from "react";
import { notificationConfigService } from "../services/notificationConfigService";
import type {
  NotificationConfigDto,
  NotificationStatus,
  SendResult,
  TestEmailResult,
} from "../services/notificationConfigService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";

type Tab = "config" | "send" | "test";

export default function NotificationConfigPage() {
  const [tab, setTab] = useState<Tab>("config");
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [configs, setConfigs] = useState<NotificationConfigDto[]>([]);
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Test email state
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<TestEmailResult | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formType, setFormType] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState("");

  useEffect(() => {
    loadProjects();
    loadStatus();
  }, []);

  useEffect(() => {
    if (selectedProject) loadConfigs();
  }, [selectedProject]);

  async function loadProjects() {
    try {
      const data = await projectService.getAllProjects();
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].name);
    } catch {
      setError("Failed to load projects");
    }
  }

  async function loadStatus() {
    try {
      const s = await notificationConfigService.getStatus();
      setStatus(s);
    } catch {
      /* ignore */
    }
  }

  async function loadConfigs() {
    setLoading(true);
    try {
      const data = await notificationConfigService.getConfigs(selectedProject);
      setConfigs(data);
    } catch {
      setError("Failed to load notification configs");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setFormType("WHATSAPP");
    setFormName("");
    setFormValue("");
  }

  async function handleSave() {
    if (!formValue.trim()) {
      setError("Recipient value is required");
      return;
    }
    setError("");
    try {
      const dto: NotificationConfigDto = {
        projectName: selectedProject,
        configType: formType,
        recipientName: formName.trim(),
        recipientValue: formValue.trim(),
        active: true,
      };
      if (editId) {
        await notificationConfigService.updateConfig(editId, dto);
        setSuccess("Config updated successfully");
      } else {
        await notificationConfigService.addConfig(dto);
        setSuccess("Config added successfully");
      }
      resetForm();
      loadConfigs();
    } catch {
      setError("Failed to save config");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this recipient?")) return;
    try {
      await notificationConfigService.deleteConfig(id);
      setSuccess("Deleted successfully");
      loadConfigs();
    } catch {
      setError("Failed to delete");
    }
  }

  function handleEdit(c: NotificationConfigDto) {
    setEditId(c.id!);
    setFormType(c.configType);
    setFormName(c.recipientName);
    setFormValue(c.recipientValue);
    setShowForm(true);
  }

  async function handleToggleActive(c: NotificationConfigDto) {
    try {
      await notificationConfigService.updateConfig(c.id!, {
        ...c,
        active: !c.active,
      });
      loadConfigs();
    } catch {
      setError("Failed to toggle status");
    }
  }

  async function handleSend() {
    if (!selectedProject) return;
    setSending(true);
    setSendResult(null);
    setError("");
    try {
      const result = await notificationConfigService.sendSummary(selectedProject);
      setSendResult(result);
      setSuccess("Notifications sent!");
    } catch {
      setError("Failed to send notifications");
    } finally {
      setSending(false);
    }
  }

  async function handleDownloadVillaWiseExcel() {
    if (!selectedProject) return;
    try {
      await notificationConfigService.downloadVillaWiseExcel(selectedProject);
    } catch {
      setError("Failed to download Villa-wise Excel");
    }
  }

  async function handleTestEmail() {
    if (!testEmail.trim()) {
      setError("Please enter an email address");
      return;
    }
    setTestSending(true);
    setTestResult(null);
    setError("");
    try {
      const result = await notificationConfigService.sendTestEmail(testEmail.trim());
      setTestResult(result);
      if (result.success) {
        setSuccess("Test email sent! Check your inbox.");
      } else {
        setError("Test email failed: " + (result.error || "Unknown error"));
      }
    } catch {
      setError("Failed to send test email");
    } finally {
      setTestSending(false);
    }
  }

  const whatsappConfigs = configs.filter((c) => c.configType === "WHATSAPP");
  const emailConfigs = configs.filter((c) => c.configType === "EMAIL");

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Notification Config</h1>

      {/* Status Banner */}
      {status && (
        <div className="mb-4 flex gap-4 text-sm">
          <span
            className={`px-3 py-1 rounded-full ${
              status.whatsappConfigured
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            WhatsApp: {status.whatsappConfigured ? "Configured" : "Not Configured"}
          </span>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800">
            Email: {status.emailFrom || "Configured"}
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            Recipients: {status.totalConfigs}
          </span>
        </div>
      )}

      {/* Project Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
        <select
          className="border rounded px-3 py-2 w-64"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {(["config", "send", "test"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "config" ? "Recipients" : t === "send" ? "Send Summary" : "Test Email"}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-3 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
          <button className="ml-2 font-bold" onClick={() => setError("")}>
            x
          </button>
        </div>
      )}
      {success && (
        <div className="mb-3 p-3 bg-green-100 text-green-700 rounded text-sm">
          {success}
          <button className="ml-2 font-bold" onClick={() => setSuccess("")}>
            x
          </button>
        </div>
      )}

      {/* Config Tab */}
      {tab === "config" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Recipients for {selectedProject}
            </h2>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Add Recipient
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="mb-4 p-4 border rounded bg-gray-50">
              <h3 className="font-semibold mb-3">
                {editId ? "Edit Recipient" : "Add Recipient"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={formType}
                    onChange={(e) =>
                      setFormType(e.target.value as "WHATSAPP" | "EMAIL")
                    }
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Recipient name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formType === "WHATSAPP" ? "Phone (with country code)" : "Email Address"}
                  </label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    placeholder={
                      formType === "WHATSAPP" ? "919876543210" : "user@example.com"
                    }
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                  {editId ? "Update" : "Save"}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <>
              {/* WhatsApp Recipients */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2 text-green-700">
                  WhatsApp Recipients ({whatsappConfigs.length})
                </h3>
                {whatsappConfigs.length === 0 ? (
                  <p className="text-sm text-gray-500">No WhatsApp recipients configured.</p>
                ) : (
                  <table className="w-full border text-sm">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="p-2 text-left border">Name</th>
                        <th className="p-2 text-left border">Phone</th>
                        <th className="p-2 text-center border">Active</th>
                        <th className="p-2 text-center border">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whatsappConfigs.map((c) => (
                        <tr key={c.id} className={!c.active ? "opacity-50" : ""}>
                          <td className="p-2 border">{c.recipientName}</td>
                          <td className="p-2 border">{c.recipientValue}</td>
                          <td className="p-2 border text-center">
                            <button
                              onClick={() => handleToggleActive(c)}
                              className={`px-2 py-1 rounded text-xs ${
                                c.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {c.active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="p-2 border text-center">
                            <button
                              onClick={() => handleEdit(c)}
                              className="text-blue-600 hover:underline text-xs mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c.id!)}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Email Recipients */}
              <div>
                <h3 className="text-md font-semibold mb-2 text-blue-700">
                  Email Recipients ({emailConfigs.length})
                </h3>
                {emailConfigs.length === 0 ? (
                  <p className="text-sm text-gray-500">No email recipients configured.</p>
                ) : (
                  <table className="w-full border text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="p-2 text-left border">Name</th>
                        <th className="p-2 text-left border">Email</th>
                        <th className="p-2 text-center border">Active</th>
                        <th className="p-2 text-center border">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailConfigs.map((c) => (
                        <tr key={c.id} className={!c.active ? "opacity-50" : ""}>
                          <td className="p-2 border">{c.recipientName}</td>
                          <td className="p-2 border">{c.recipientValue}</td>
                          <td className="p-2 border text-center">
                            <button
                              onClick={() => handleToggleActive(c)}
                              className={`px-2 py-1 rounded text-xs ${
                                c.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {c.active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="p-2 border text-center">
                            <button
                              onClick={() => handleEdit(c)}
                              className="text-blue-600 hover:underline text-xs mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c.id!)}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Send Tab */}
      {tab === "send" && (
        <div>
          <div className="p-4 border rounded bg-gray-50 mb-4">
            <h2 className="text-lg font-semibold mb-2">
              Send Work Execution Summary
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              This will send the following to all active WhatsApp and Email recipients for{" "}
              <strong>{selectedProject}</strong>:
            </p>
            <ul className="text-sm text-gray-600 mb-4 ml-4 list-disc space-y-1">
              <li>Summary Image (dashboard overview)</li>
              <li>Villa-wise Status Excel (1-237)</li>
            </ul>

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={handleSend}
                disabled={sending}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Now"}
              </button>
              <button
                onClick={handleDownloadVillaWiseExcel}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download Villa-wise Excel
              </button>
            </div>

            {!status?.whatsappConfigured && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>WhatsApp not configured.</strong> Set the environment variables{" "}
                <code className="bg-yellow-100 px-1">WHATSAPP_PHONE_NUMBER_ID</code> and{" "}
                <code className="bg-yellow-100 px-1">WHATSAPP_ACCESS_TOKEN</code> from your
                Meta Developer Portal. Email sending will still work.
              </div>
            )}
          </div>

          {/* Send Results */}
          {sendResult && (
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Send Results</h3>
              <p className="text-sm text-gray-600 mb-2">
                Sent at: {new Date(sendResult.sentAt).toLocaleString()}
              </p>
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left border">Type</th>
                    <th className="p-2 text-left border">Recipient</th>
                    <th className="p-2 text-left border">Name</th>
                    <th className="p-2 text-center border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sendResult.results.map((r, i) => (
                    <tr key={i}>
                      <td className="p-2 border">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            r.type === "WHATSAPP"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="p-2 border">{r.recipient}</td>
                      <td className="p-2 border">{r.name}</td>
                      <td className="p-2 border text-center">
                        {r.type === "WHATSAPP" ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${r.imageSent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              Image: {r.imageSent ? "Sent" : "Failed"}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${r.villaWiseExcelSent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              Villa Excel: {r.villaWiseExcelSent ? "Sent" : "Failed"}
                            </span>
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs ${r.sent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {r.sent ? "Sent" : "Failed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Test Email Tab */}
      {tab === "test" && (
        <div>
          <div className="p-6 border rounded bg-gray-50 max-w-lg">
            <h2 className="text-lg font-semibold mb-2">Test Email Configuration</h2>
            <p className="text-sm text-gray-600 mb-1">
              Send a test email to verify the SMTP configuration is working.
            </p>
            {status?.emailFrom && (
              <p className="text-sm text-gray-500 mb-4">
                Sending from: <strong>{status.emailFrom}</strong>
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send test email to
              </label>
              <input
                type="email"
                className="border rounded px-3 py-2 w-full"
                placeholder="recipient@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTestEmail()}
              />
            </div>

            <button
              onClick={handleTestEmail}
              disabled={testSending || !testEmail.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testSending ? "Sending..." : "Send Test Email"}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`mt-4 p-4 border rounded ${
                testResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  testResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {testResult.success ? "Test Email Sent Successfully!" : "Test Email Failed"}
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>From:</strong> {testResult.from}
                </p>
                <p>
                  <strong>To:</strong> {testResult.to}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {new Date(testResult.timestamp).toLocaleString()}
                </p>
                {testResult.success && testResult.message && (
                  <p className="text-green-700 mt-2">{testResult.message}</p>
                )}
                {!testResult.success && testResult.error && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs font-mono break-all">
                    {testResult.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
