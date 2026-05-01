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
import {
  attendanceReportService,
  type AttendanceReportDto,
} from "../services/attendanceReportService";
import { projectService, type ProjectDto } from "../services/projectService";
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

type Tab = "capture" | "submissions" | "approvals" | "reports";

const TAB_LABELS: Record<Tab, string> = {
  capture: "Capture Attendance",
  submissions: "My Submissions",
  approvals: "Pending Approvals",
  reports: "Reports",
};

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

  // Check if user can see reports (Admin, Partner, or Accounting)
  const canViewReports = currentUser?.roles.some((r) =>
    ["ADMIN", "PARTNER", "ACCOUNTING"].includes(r.name)
  );

  const visibleTabs: Tab[] = canViewReports
    ? ["capture", "submissions", "approvals", "reports"]
    : ["capture", "submissions", "approvals"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-arcadia-800">Site Attendance</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t
                ? "bg-arcadia-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-200"
              }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "capture" && (
        <CaptureTab users={users} currentUser={currentUser} onSubmitSuccess={onSubmitSuccess} />
      )}
      {tab === "submissions" && <SubmissionsTab key={submissionKey} currentUser={currentUser} />}
      {tab === "approvals" && <ApprovalsTab currentUser={currentUser} />}
      {tab === "reports" && <ReportsTab />}
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
  const [maleMastri, setMaleMastri] = useState(0);
  const [femaleMastri, setFemaleMastri] = useState(0);
  const [maleHelper, setMaleHelper] = useState(0);
  const [femaleHelper, setFemaleHelper] = useState(0);
  const [detected, setDetected] = useState(false);
  const [mismatchError, setMismatchError] = useState("");

  const [siteName, setSiteName] = useState("");
  const [projectList, setProjectList] = useState<ProjectDto[]>([]);
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

  // Load active projects for dropdown
  useEffect(() => {
    projectService.getActiveProjects().then((projects) => {
      setProjectList(projects);
      if (projects.length > 0 && !siteName) {
        setSiteName(projects[0].name);
      }
    }).catch(() => {});
  }, []);

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
    setMaleMastri(0);
    setFemaleMastri(0);
    setMaleHelper(0);
    setFemaleHelper(0);
    setMismatchError("");
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
        setMaleMastri(0);
        setFemaleMastri(0);
        setMaleHelper(0);
        setFemaleHelper(0);
        setMismatchError("");
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
    if (!siteName) return alert("Please select a project / site name.");
    if (totalWorkers === 0) return alert("Worker count cannot be 0.");
    if (!myChain && approverId === 0) return alert("Please select an approver.");

    const enteredSum = maleMastri + femaleMastri + maleHelper + femaleHelper;
    if (enteredSum !== totalWorkers) {
      setMismatchError(`Total mismatch: AI detected ${totalWorkers} workers but your entries add up to ${enteredSum}. Please correct.`);
      return;
    }
    setMismatchError("");

    setSubmitting(true);
    try {
      const req: CreateSiteAttendanceRequest = {
        attendanceDate: new Date().toISOString().split("T")[0],
        siteName,
        imageBase64: capturedImage,
        totalWorkers,
        maleMastriCount: maleMastri,
        femaleMastriCount: femaleMastri,
        maleHelperCount: maleHelper,
        femaleHelperCount: femaleHelper,
        maleCount: maleMastri + maleHelper,
        femaleCount: femaleMastri + femaleHelper,
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
      setMaleMastri(0);
      setFemaleMastri(0);
      setMaleHelper(0);
      setFemaleHelper(0);
      setMismatchError("");
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
  }, [capturedImage, approverId, totalWorkers, maleMastri, femaleMastri, maleHelper, femaleHelper, siteName, remarks, myChain, onSubmitSuccess]);

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
        {/* Detection Results & Worker Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Worker Details</div>
          <div className="p-4 space-y-4">
            {/* AI-detected total */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Total Workers (AI Detected)</label>
              <input
                type="number" min={0} value={totalWorkers}
                onChange={(e) => { setTotalWorkers(Number(e.target.value)); setMismatchError(""); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-2xl font-bold text-center text-arcadia-800"
              />
              {detected && (
                <p className="text-xs text-blue-600 mt-1">AI detected {totalWorkers} people in the photo. You can adjust if needed.</p>
              )}
            </div>

            {/* Mastri / Helper breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Male - Mastri</label>
                <input
                  type="number" min={0} value={maleMastri}
                  onChange={(e) => { setMaleMastri(Number(e.target.value)); setMismatchError(""); }}
                  className="w-full border border-blue-200 bg-blue-50 rounded-lg px-3 py-2.5 text-xl font-bold text-center text-blue-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Female - Mastri</label>
                <input
                  type="number" min={0} value={femaleMastri}
                  onChange={(e) => { setFemaleMastri(Number(e.target.value)); setMismatchError(""); }}
                  className="w-full border border-pink-200 bg-pink-50 rounded-lg px-3 py-2.5 text-xl font-bold text-center text-pink-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Male - Helper</label>
                <input
                  type="number" min={0} value={maleHelper}
                  onChange={(e) => { setMaleHelper(Number(e.target.value)); setMismatchError(""); }}
                  className="w-full border border-indigo-200 bg-indigo-50 rounded-lg px-3 py-2.5 text-xl font-bold text-center text-indigo-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Female - Helper</label>
                <input
                  type="number" min={0} value={femaleHelper}
                  onChange={(e) => { setFemaleHelper(Number(e.target.value)); setMismatchError(""); }}
                  className="w-full border border-purple-200 bg-purple-50 rounded-lg px-3 py-2.5 text-xl font-bold text-center text-purple-700"
                />
              </div>
            </div>

            {/* Sum vs Total comparison */}
            {(() => {
              const sum = maleMastri + femaleMastri + maleHelper + femaleHelper;
              const match = sum === totalWorkers;
              if (sum === 0 && totalWorkers === 0) return null;
              return (
                <div className={`rounded-lg px-4 py-2.5 text-sm font-medium flex justify-between items-center ${
                  match ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  <span>Your entries: {sum}</span>
                  <span>{match ? "Matches AI total" : `AI total: ${totalWorkers} (difference: ${Math.abs(totalWorkers - sum)})`}</span>
                </div>
              );
            })()}

            {mismatchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {mismatchError}
              </div>
            )}
          </div>
        </div>

        {/* Submission Form */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Submit for Approval</div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Project / Site Name</label>
              <select
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500"
              >
                <option value="">-- Select Project --</option>
                {projectList.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
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
              disabled={submitting || !capturedImage || (totalWorkers > 0 && (maleMastri + femaleMastri + maleHelper + femaleHelper) !== totalWorkers)}
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

function SubmissionsTab({ currentUser }: { currentUser: User | null }) {
  const [records, setRecords] = useState<SiteAttendanceDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    siteAttendanceService
      .getMySubmissions()
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
        Loading submissions...
      </div>
    );
  }
  if (records.length === 0) return <p className="text-gray-500 py-6">No submissions yet.</p>;

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <AttendanceCard key={r.id} record={r} showApproveActions={false} currentUser={currentUser} onActionDone={loadData} />
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
  const [deleting, setDeleting] = useState(false);

  const isAdmin = currentUser?.roles.some((r) => r.name === "ADMIN") ?? false;

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

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this attendance record?\n\nSite: ${record.siteName}\nDate: ${record.attendanceDate}\nSubmitted by: ${record.submittedByName}\n\nThis action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await siteAttendanceService.deleteRecord(record.id);
      onActionDone?.();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Delete failed");
    } finally {
      setDeleting(false);
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
          {record.createdAt && (
            <div className="text-xs text-gray-400 mt-0.5">
              Captured: {new Date(record.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
            </div>
          )}
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

      <div className="grid grid-cols-5 gap-2 mt-3">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-bold text-arcadia-800">{record.totalWorkers}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <div className="text-xs text-blue-500">M-Mastri</div>
          <div className="text-lg font-bold text-blue-700">{record.maleMastriCount}</div>
        </div>
        <div className="bg-pink-50 rounded-lg p-2 text-center">
          <div className="text-xs text-pink-500">F-Mastri</div>
          <div className="text-lg font-bold text-pink-700">{record.femaleMastriCount}</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2 text-center">
          <div className="text-xs text-indigo-500">M-Helper</div>
          <div className="text-lg font-bold text-indigo-700">{record.maleHelperCount}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-2 text-center">
          <div className="text-xs text-purple-500">F-Helper</div>
          <div className="text-lg font-bold text-purple-700">{record.femaleHelperCount}</div>
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

      <div className="mt-3 flex gap-2 items-center">
        <button onClick={() => setShowImage(!showImage)} className="text-xs text-arcadia-600 underline">
          {showImage ? "Hide Photo" : "View Photo"}
        </button>
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Record"}
          </button>
        )}
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

/* ------------------------------------------------------------------ */
/*  REPORTS TAB                                                       */
/* ------------------------------------------------------------------ */

type ReportView = "site" | "date" | "detail";

function ReportsTab() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [siteName, setSiteName] = useState("");
  const [siteNames, setSiteNames] = useState<string[]>([]);
  const [report, setReport] = useState<AttendanceReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<ReportView>("site");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    attendanceReportService.getSiteNames().then(setSiteNames).catch(() => {});
  }, []);

  async function fetchReport() {
    if (!fromDate || !toDate) {
      setError("Please select both From and To dates");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await attendanceReportService.getReport(fromDate, toDate, siteName || undefined);
      setReport(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "excel" | "pdf") {
    if (!fromDate || !toDate) return;
    try {
      setExporting(true);
      if (format === "excel") {
        await attendanceReportService.downloadExcel(fromDate, toDate, siteName || undefined);
      } else {
        await attendanceReportService.downloadPdf(fromDate, toDate, siteName || undefined);
      }
    } catch (e: any) {
      setError("Export failed: " + (e.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Site (optional)</label>
            <select
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500"
            >
              <option value="">All Sites</option>
              {siteNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex-1 bg-arcadia-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <SummaryCard label="Total Records" value={report.totalRecords} color="blue" />
            <SummaryCard label="Total Workers" value={report.totalWorkers} color="green" />
            <SummaryCard label="M-Mastri" value={report.totalMaleMastri} color="indigo" />
            <SummaryCard label="F-Mastri" value={report.totalFemaleMastri} color="pink" />
            <SummaryCard label="M-Helper" value={report.totalMaleHelper} color="indigo" />
            <SummaryCard label="F-Helper" value={report.totalFemaleHelper} color="pink" />
          </div>

          {/* View toggles + Export */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {(["site", "date", "detail"] as ReportView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    view === v ? "bg-white shadow text-arcadia-700" : "text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {v === "site" ? "Site Summary" : v === "date" ? "Date Summary" : "Detail Records"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport("excel")}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                <span>&#128196;</span> Excel
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                <span>&#128196;</span> PDF
              </button>
            </div>
          </div>

          {/* Tables */}
          {view === "site" && <SiteSummaryTable report={report} />}
          {view === "date" && <DateSummaryTable report={report} />}
          {view === "detail" && <DetailRecordsTable report={report} />}
        </>
      )}

      {!report && !loading && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl text-gray-300 mb-3">&#128202;</div>
          <p className="text-gray-500">Select a date range and click "Search" to view reports.</p>
          <p className="text-sm text-gray-400 mt-1">Only approved attendance records are included in reports.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.blue}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

function SiteSummaryTable({ report }: { report: AttendanceReportDto }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Site Name</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">Records</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">Total</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">M-Mastri</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">F-Mastri</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">M-Helper</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">F-Helper</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">Days</th>
            </tr>
          </thead>
          <tbody>
            {report.siteSummaries.map((s, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-3 py-3 font-medium">{s.siteName}</td>
                <td className="px-3 py-3 text-right">{s.totalRecords}</td>
                <td className="px-3 py-3 text-right font-semibold">{s.totalWorkers}</td>
                <td className="px-3 py-3 text-right">{s.totalMaleMastri}</td>
                <td className="px-3 py-3 text-right">{s.totalFemaleMastri}</td>
                <td className="px-3 py-3 text-right">{s.totalMaleHelper}</td>
                <td className="px-3 py-3 text-right">{s.totalFemaleHelper}</td>
                <td className="px-3 py-3 text-right">{s.totalDays}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-yellow-50 font-bold border-t-2 border-gray-300">
            <tr>
              <td className="px-3 py-3">TOTAL</td>
              <td className="px-3 py-3 text-right">{report.totalRecords}</td>
              <td className="px-3 py-3 text-right">{report.totalWorkers}</td>
              <td className="px-3 py-3 text-right">{report.totalMaleMastri}</td>
              <td className="px-3 py-3 text-right">{report.totalFemaleMastri}</td>
              <td className="px-3 py-3 text-right">{report.totalMaleHelper}</td>
              <td className="px-3 py-3 text-right">{report.totalFemaleHelper}</td>
              <td className="px-3 py-3 text-right">{report.totalDays}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {report.siteSummaries.length === 0 && (
        <p className="text-center py-8 text-gray-400">No approved records found for this period.</p>
      )}
    </div>
  );
}

function DateSummaryTable({ report }: { report: AttendanceReportDto }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Sites</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Records</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Total Workers</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">M-Mastri</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">F-Mastri</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">M-Helper</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">F-Helper</th>
            </tr>
          </thead>
          <tbody>
            {report.dateSummaries.map((d, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric"
                  })}
                </td>
                <td className="px-4 py-3 text-right">{d.siteCount}</td>
                <td className="px-4 py-3 text-right">{d.totalRecords}</td>
                <td className="px-4 py-3 text-right font-semibold">{d.totalWorkers}</td>
                <td className="px-4 py-3 text-right">{d.totalMaleMastri}</td>
                <td className="px-4 py-3 text-right">{d.totalFemaleMastri}</td>
                <td className="px-4 py-3 text-right">{d.totalMaleHelper}</td>
                <td className="px-4 py-3 text-right">{d.totalFemaleHelper}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-yellow-50 font-bold border-t-2 border-gray-300">
            <tr>
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right">{report.totalRecords}</td>
              <td className="px-4 py-3 text-right">{report.totalWorkers}</td>
              <td className="px-4 py-3 text-right">{report.totalMaleMastri}</td>
              <td className="px-4 py-3 text-right">{report.totalFemaleMastri}</td>
              <td className="px-4 py-3 text-right">{report.totalMaleHelper}</td>
              <td className="px-4 py-3 text-right">{report.totalFemaleHelper}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {report.dateSummaries.length === 0 && (
        <p className="text-center py-8 text-gray-400">No approved records found for this period.</p>
      )}
    </div>
  );
}

function DetailRecordsTable({ report }: { report: AttendanceReportDto }) {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-center px-3 py-3 font-semibold text-gray-700">Photo</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Date</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Captured At</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Site</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Submitted By</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">Total</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">M-Mastri</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">F-Mastri</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">M-Helper</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">F-Helper</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Remarks</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700">Approved By</th>
            </tr>
          </thead>
          <tbody>
            {report.records.map((r, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-center">
                  {r.imageBase64 ? (
                    <button
                      onClick={() => {
                        setModalImage(r.imageBase64);
                        setModalTitle(`${r.siteName} - ${new Date(r.attendanceDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`);
                      }}
                      className="inline-block rounded-lg overflow-hidden border-2 border-gray-200 hover:border-arcadia-400 transition cursor-pointer shadow-sm hover:shadow-md"
                      title="Click to enlarge"
                    >
                      <img
                        src={r.imageBase64}
                        alt="Site attendance"
                        className="w-14 h-14 object-cover"
                      />
                    </button>
                  ) : (
                    <span className="text-gray-300 text-xl" title="No photo">&#128247;</span>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {new Date(r.attendanceDate + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric"
                  })}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-500">
                  {r.capturedAt ? new Date(r.capturedAt).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
                  }) : "-"}
                </td>
                <td className="px-3 py-2.5">{r.siteName}</td>
                <td className="px-3 py-2.5">{r.submittedByName}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{r.totalWorkers}</td>
                <td className="px-3 py-2.5 text-right">{r.maleMastriCount}</td>
                <td className="px-3 py-2.5 text-right">{r.femaleMastriCount}</td>
                <td className="px-3 py-2.5 text-right">{r.maleHelperCount}</td>
                <td className="px-3 py-2.5 text-right">{r.femaleHelperCount}</td>
                <td className="px-3 py-2.5 text-gray-500 max-w-[200px] truncate">{r.remarks || "-"}</td>
                <td className="px-3 py-2.5">{r.approverName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.records.length === 0 && (
        <p className="text-center py-8 text-gray-400">No approved records found for this period.</p>
      )}
      {report.records.length > 0 && (
        <div className="border-t px-4 py-2 bg-gray-50 text-xs text-gray-500">
          Showing {report.records.length} record{report.records.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          imageSrc={modalImage}
          title={modalTitle}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  IMAGE MODAL (full-size view)                                      */
/* ------------------------------------------------------------------ */

function ImageModal({
  imageSrc,
  title,
  onClose,
}: {
  imageSrc: string;
  title: string;
  onClose: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 truncate">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2 transition"
            title="Close"
          >
            &times;
          </button>
        </div>
        {/* Image */}
        <div className="p-4 flex items-center justify-center bg-gray-100">
          <img
            src={imageSrc}
            alt={title}
            className="max-w-full max-h-[75vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
