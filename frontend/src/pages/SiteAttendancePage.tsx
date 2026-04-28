import { useState, useEffect, useRef, useCallback } from "react";
import {
  siteAttendanceService,
  type SiteAttendanceDto,
  type CreateSiteAttendanceRequest,
  type ApprovalStepDto,
} from "../services/siteAttendanceService";
import {
  approvalChainService,
  type ApprovalChainDto,
} from "../services/approvalChainService";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import type { User } from "../types/user";
import api from "../services/api";

const ROLE_DISPLAY: Record<string, string> = {
  OFFICE_ASSISTANT: "Office Assistant",
  SUPERVISOR: "Supervisor",
  ENGINEERING: "Engineering",
  PARTNER: "Partner",
  ACCOUNTING: "Accounting",
  ADMIN: "Admin",
  SALES: "Sales",
  OPERATIONS: "Operations",
  ACCOUNTS: "Accounts",
};
function displayRole(code: string) {
  return ROLE_DISPLAY[code] || code;
}

/* ------------------------------------------------------------------ */
/*  Server-side gender detection                                      */
/* ------------------------------------------------------------------ */

async function detectPeople(
  imageBase64: string
): Promise<{ total: number; male: number; female: number }> {
  const response = await api.post("/detect/gender", { imageBase64 }, { timeout: 300000 });
  const data = response.data;
  if (data.error) throw new Error(data.error);
  return { total: data.total ?? 0, male: data.male ?? 0, female: data.female ?? 0 };
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

type Tab = "capture" | "submissions" | "approvals";

export default function SiteAttendancePage() {
  const [tab, setTab] = useState<Tab>("capture");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Key to force re-mount of SubmissionsTab when new submission is created
  const [submissionKey, setSubmissionKey] = useState(0);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(() => { });
    userService.getAll().then(setUsers).catch(() => { });
  }, []);

  function onSubmitSuccess() {
    setSubmissionKey((k) => k + 1);
    setTab("submissions"); // Auto-switch to My Submissions
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-arcadia-800">Site Attendance</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["capture", "submissions", "approvals"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t
                ? "bg-arcadia-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-200"
              }`}
          >
            {t === "capture"
              ? "Capture Attendance"
              : t === "submissions"
                ? "My Submissions"
                : "Pending Approvals"}
          </button>
        ))}
      </div>

      {tab === "capture" && (
        <CaptureTab users={users} currentUser={currentUser} onSubmitSuccess={onSubmitSuccess} />
      )}
      {tab === "submissions" && <SubmissionsTab key={submissionKey} />}
      {tab === "approvals" && <ApprovalsTab currentUser={currentUser} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CAPTURE TAB                                                       */
/* ------------------------------------------------------------------ */

function CaptureTab({
  users,
  currentUser,
  onSubmitSuccess,
}: {
  users: User[];
  currentUser: User | null;
  onSubmitSuccess: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const [totalWorkers, setTotalWorkers] = useState(0);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [detected, setDetected] = useState(false);

  const [siteName, setSiteName] = useState("Praneeth Arcadia Premium");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Approval chain info for the current user
  const [myChain, setMyChain] = useState<ApprovalChainDto | null>(null);
  const [chainLoading, setChainLoading] = useState(true);

  // Legacy fallback
  const [approverId, setApproverId] = useState<number>(0);
  const approvers = users.filter((u) => u.id !== currentUser?.id && u.active);

  // Load the user's approval chain on mount
  useEffect(() => {
    if (!currentUser) return;
    setChainLoading(true);
    approvalChainService
      .getAll()
      .then((chains) => {
        const userRoles = currentUser.roles?.map((r) => r.name) || [];
        // Find a chain that matches the user's role AND has all steps with users assigned
        const matched = chains.find(
          (c) =>
            c.active &&
            userRoles.includes(c.submitterRoleName) &&
            c.steps.length > 0 &&
            c.steps.every((s) => s.approverUserId)
        );
        setMyChain(matched || null);
      })
      .catch(() => setMyChain(null))
      .finally(() => setChainLoading(false));
  }, [currentUser]);

  /* Start camera */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      alert("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => { });
    }
  }, [cameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    setDetected(false);
    setTotalWorkers(0);
    setMaleCount(0);
    setFemaleCount(0);
  }, [stopCamera]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        setDetected(false);
        setTotalWorkers(0);
        setMaleCount(0);
        setFemaleCount(0);
        stopCamera();
      };
      reader.readAsDataURL(file);
    },
    [stopCamera]
  );

  const runDetection = useCallback(async () => {
    if (!capturedImage) return;
    setDetecting(true);
    setDetectionError(null);
    try {
      const result = await detectPeople(capturedImage);
      setTotalWorkers(result.total);
      setMaleCount(result.male);
      setFemaleCount(result.female);
      setDetected(true);
      if (result.total === 0) {
        setDetectionError("AI found 0 faces. You can enter counts manually.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || String(err);
      setDetectionError(`AI detection failed: ${msg}. Enter counts manually.`);
    } finally {
      setDetecting(false);
    }
  }, [capturedImage]);

  useEffect(() => {
    if (capturedImage && !detecting && !detected) {
      const timer = setTimeout(() => runDetection(), 500);
      return () => clearTimeout(timer);
    }
  }, [capturedImage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    if (!capturedImage) return alert("Please capture an image first.");
    if (totalWorkers === 0) return alert("Worker count cannot be 0.");
    if (!myChain && approverId === 0) return alert("Please select an approver.");

    setSubmitting(true);
    try {
      const req: CreateSiteAttendanceRequest = {
        attendanceDate: new Date().toISOString().split("T")[0],
        siteName,
        imageBase64: capturedImage,
        totalWorkers,
        maleCount,
        femaleCount,
        remarks,
      };
      if (!myChain && approverId > 0) {
        req.approverId = approverId;
      }
      await siteAttendanceService.create(req);
      setSuccess(true);
      setCapturedImage(null);
      setDetected(false);
      setTotalWorkers(0);
      setMaleCount(0);
      setFemaleCount(0);
      setRemarks("");
      setTimeout(() => {
        setSuccess(false);
        onSubmitSuccess(); // Switch to My Submissions tab
      }, 1500);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }, [capturedImage, approverId, totalWorkers, maleCount, femaleCount, siteName, remarks, myChain, onSubmitSuccess]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT — Camera / Image */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Camera Capture</div>
          <div className="p-4 space-y-4">
            {!capturedImage && !cameraActive && (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="text-6xl text-gray-300">&#128247;</div>
                <p className="text-gray-500">Capture a photo of workers at the site</p>
                <div className="flex gap-3">
                  <button onClick={startCamera} className="px-5 py-2.5 bg-arcadia-600 text-white rounded-lg font-medium hover:bg-arcadia-700 transition">
                    Open Camera
                  </button>
                  <label className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition cursor-pointer">
                    Upload Photo
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
                <div className="flex gap-3 justify-center">
                  <button onClick={capturePhoto} className="px-6 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition">
                    Capture
                  </button>
                  <button onClick={stopCamera} className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="space-y-3">
                <div className="relative">
                  <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
                  {detecting && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      <p className="text-white font-semibold text-sm">Detecting faces & classifying gender...</p>
                      <p className="text-white/70 text-xs">First time may take 2-3 minutes to load AI models</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 justify-center">
                  {(detected || detectionError) && !detecting && (
                    <button onClick={runDetection} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                      Re-detect (AI)
                    </button>
                  )}
                  <button
                    onClick={() => { setCapturedImage(null); setDetected(false); setDetectionError(null); }}
                    disabled={detecting}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    Retake
                  </button>
                </div>
                {detectionError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">{detectionError}</div>
                )}
              </div>
            )}
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* RIGHT — Detection Results & Form */}
      <div className="space-y-4">
        {/* Detection Results */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Worker Detection Results</div>
          <div className="p-4">
            {detected && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-4">
                AI detected the counts below. You can adjust them manually if needed.
              </p>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Total Workers</label>
                <input
                  type="number" min={0} value={totalWorkers}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setTotalWorkers(v);
                    if (maleCount + femaleCount !== v) {
                      setMaleCount(Math.round(v * 0.6));
                      setFemaleCount(v - Math.round(v * 0.6));
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-2xl font-bold text-center text-arcadia-800"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Male</label>
                <input
                  type="number" min={0} max={totalWorkers} value={maleCount}
                  onChange={(e) => { const m = Math.min(Number(e.target.value), totalWorkers); setMaleCount(m); setFemaleCount(totalWorkers - m); }}
                  className="w-full border border-blue-200 bg-blue-50 rounded-lg px-3 py-2.5 text-2xl font-bold text-center text-blue-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Female</label>
                <input
                  type="number" min={0} max={totalWorkers} value={femaleCount}
                  onChange={(e) => { const f = Math.min(Number(e.target.value), totalWorkers); setFemaleCount(f); setMaleCount(totalWorkers - f); }}
                  className="w-full border border-pink-200 bg-pink-50 rounded-lg px-3 py-2.5 text-2xl font-bold text-center text-pink-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Submit for Approval</div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Site Name</label>
              <input
                type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Approval Chain Info — shown disabled so user sees who it goes to */}
            {chainLoading ? (
              <div className="text-sm text-gray-400">Loading approval chain...</div>
            ) : myChain ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="text-xs text-gray-500 block mb-2">Approval Chain (auto-assigned)</label>
                <div className="flex items-center gap-1 flex-wrap">
                  {myChain.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      {idx > 0 && <span className="text-gray-300">&rarr;</span>}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${step.blocking ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                        {step.approverUserName || displayRole(step.approverRoleName)}
                        <span className="font-normal text-gray-500 ml-1">
                          ({displayRole(step.approverRoleName)})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your role: {currentUser?.roles?.map((r) => displayRole(r.name)).join(", ")}
                </p>
              </div>
            ) : (
              /* Legacy approver dropdown */
              <div>
                <label className="text-xs text-gray-500 block mb-1">Send for Approval to</label>
                <select
                  value={approverId}
                  onChange={(e) => setApproverId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0}>-- Select Approver --</option>
                  {approvers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 block mb-1">Remarks</label>
              <textarea
                value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Optional notes..."
              />
            </div>

            {success && (
              <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm font-medium">
                Attendance submitted successfully! Switching to My Submissions...
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !capturedImage}
              className="w-full bg-arcadia-600 text-white py-3 rounded-lg font-semibold hover:bg-arcadia-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SUBMISSIONS TAB                                                   */
/* ------------------------------------------------------------------ */

function SubmissionsTab() {
  const [records, setRecords] = useState<SiteAttendanceDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siteAttendanceService
      .getMySubmissions()
      .then(setRecords)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-6">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
        Loading submissions...
      </div>
    );
  }
  if (records.length === 0) return <p className="text-gray-500 py-6">No submissions yet.</p>;

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <AttendanceCard key={r.id} record={r} showApproveActions={false} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APPROVALS TAB                                                     */
/* ------------------------------------------------------------------ */

function ApprovalsTab({ currentUser }: { currentUser: User | null }) {
  const [records, setRecords] = useState<SiteAttendanceDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    siteAttendanceService
      .getPendingApprovals()
      .then(setRecords)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-6">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
        Loading pending approvals...
      </div>
    );
  }
  if (records.length === 0) return <p className="text-gray-500 py-6">No pending approvals.</p>;

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <AttendanceCard key={r.id} record={r} showApproveActions onActionDone={loadData} currentUser={currentUser} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APPROVAL CHAIN PROGRESS TRACKER                                   */
/* ------------------------------------------------------------------ */

function ApprovalChainProgress({
  steps,
  currentStepOrder,
  status,
}: {
  steps: ApprovalStepDto[];
  currentStepOrder: number;
  status: string;
}) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-500 mb-2">Approval Progress</p>
      <div className="space-y-1.5">
        {steps.map((step) => {
          let bgClass = "bg-gray-50 border-gray-200";
          let statusIcon = "&#9679;"; // filled circle
          let statusColor = "text-gray-400";

          if (step.status === "APPROVED") {
            bgClass = "bg-green-50 border-green-200";
            statusIcon = "&#10003;"; // checkmark
            statusColor = "text-green-600";
          } else if (step.status === "REJECTED") {
            bgClass = "bg-red-50 border-red-200";
            statusIcon = "&#10007;"; // X
            statusColor = "text-red-600";
          } else if (
            step.stepOrder === currentStepOrder &&
            (status === "PENDING" || status === "IN_APPROVAL")
          ) {
            bgClass = "bg-yellow-50 border-yellow-300";
            statusIcon = "&#9654;"; // play arrow
            statusColor = "text-yellow-600";
          }

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${bgClass}`}
            >
              <span className={`text-base ${statusColor}`} dangerouslySetInnerHTML={{ __html: statusIcon }} />
              <div className="flex-1">
                <span className="font-medium text-gray-700">
                  Step {step.stepOrder}: {displayRole(step.approverRoleName)}
                </span>
                {step.assignedToName && (
                  <span className="text-gray-500 ml-1">
                    &mdash; {step.assignedToName}
                  </span>
                )}
              </div>
              <div className="text-xs">
                {step.status === "APPROVED" && (
                  <span className="text-green-600 font-medium">
                    Approved{step.actedByName ? ` by ${step.actedByName}` : ""}
                  </span>
                )}
                {step.status === "REJECTED" && (
                  <span className="text-red-600 font-medium">
                    Rejected{step.actedByName ? ` by ${step.actedByName}` : ""}
                  </span>
                )}
                {step.status === "PENDING" && step.stepOrder === currentStepOrder && (
                  <span className="text-yellow-600 font-medium">Waiting...</span>
                )}
                {step.status === "PENDING" && step.stepOrder !== currentStepOrder && (
                  <span className="text-gray-400">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ATTENDANCE CARD                                                   */
/* ------------------------------------------------------------------ */

function AttendanceCard({
  record,
  showApproveActions,
  onActionDone,
  // @ts-ignore
  currentUser,
}: {
  record: SiteAttendanceDto;
  showApproveActions: boolean;
  onActionDone?: () => void;
  currentUser?: User | null;
}) {
  const [showImage, setShowImage] = useState(false);
  const [actionRemarks, setActionRemarks] = useState("");
  const [acting, setActing] = useState(false);

  const handleAction = async (action: "APPROVED" | "REJECTED") => {
    setActing(true);
    try {
      await siteAttendanceService.approve(record.id, { action, remarks: actionRemarks });
      onActionDone?.();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Action failed");
    } finally {
      setActing(false);
    }
  };

  const statusColor =
    record.status === "APPROVED"
      ? "bg-green-100 text-green-700"
      : record.status === "REJECTED"
        ? "bg-red-100 text-red-700"
        : record.status === "IN_APPROVAL"
          ? "bg-blue-100 text-blue-700"
          : "bg-yellow-100 text-yellow-700";

  const statusLabel =
    record.status === "IN_APPROVAL"
      ? `Step ${record.currentStepOrder}/${record.totalSteps}`
      : record.status;

  const canApprove =
    showApproveActions &&
    (record.status === "PENDING" || record.status === "IN_APPROVAL");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-gray-800">{record.siteName}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {record.attendanceDate} &middot; by {record.submittedByName}
          </div>
          {record.approvalChainName && (
            <div className="text-xs text-arcadia-600 mt-0.5">Chain: {record.approvalChainName}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
          {record.currentStepRoleName && record.status !== "APPROVED" && record.status !== "REJECTED" && (
            <span className="text-xs text-gray-500">
              Pending: {displayRole(record.currentStepRoleName)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-bold text-arcadia-800">{record.totalWorkers}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <div className="text-xs text-blue-500">Male</div>
          <div className="text-xl font-bold text-blue-700">{record.maleCount}</div>
        </div>
        <div className="bg-pink-50 rounded-lg p-2 text-center">
          <div className="text-xs text-pink-500">Female</div>
          <div className="text-xl font-bold text-pink-700">{record.femaleCount}</div>
        </div>
      </div>

      {/* Approval Chain Progress */}
      {record.approvalSteps && record.approvalSteps.length > 0 && (
        <ApprovalChainProgress
          steps={record.approvalSteps}
          currentStepOrder={record.currentStepOrder}
          status={record.status}
        />
      )}

      {/* Show approver for legacy records */}
      {!record.approvalChainId && record.approverName && (
        <p className="text-sm text-gray-600 mt-2">
          <span className="font-medium">Approver:</span> {record.approverName}
        </p>
      )}

      {record.remarks && (
        <p className="text-sm text-gray-600 mt-2">
          <span className="font-medium">Remarks:</span> {record.remarks}
        </p>
      )}

      {record.approverRemarks && (
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-medium">Approver notes:</span> {record.approverRemarks}
        </p>
      )}

      {record.status === "REJECTED" &&
        record.approvalSteps?.filter((s) => s.status === "REJECTED").map((s) => (
          <div key={s.id} className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <p className="text-sm text-red-700">
              <span className="font-medium">
                Rejected by {s.actedByName || s.assignedToName} ({displayRole(s.approverRoleName)}):
              </span>{" "}
              {s.remarks || "No remarks"}
            </p>
          </div>
        ))}

      <div className="mt-3 flex gap-2">
        <button onClick={() => setShowImage(!showImage)} className="text-xs text-arcadia-600 underline">
          {showImage ? "Hide Photo" : "View Photo"}
        </button>
      </div>

      {showImage && record.imageBase64 && (
        <img src={record.imageBase64} alt="Site" className="mt-2 rounded-lg max-h-64 object-contain" />
      )}

      {canApprove && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <textarea
            placeholder="Remarks (optional)"
            value={actionRemarks}
            onChange={(e) => setActionRemarks(e.target.value)}
            rows={1}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("APPROVED")}
              disabled={acting}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction("REJECTED")}
              disabled={acting}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
