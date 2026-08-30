import React, { useState, useCallback, useEffect } from "react";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";
import { villaConstructionService } from "../services/villaConstructionService";
import type { VillaConstructionStatusDto } from "../services/villaConstructionService";
import {
  ARCADIA_PLOTS,
  CONSTRUCTION_PHASES,
  isKalpavruksha,
  isArcadia,
  isAravindham,
  hasMasterPlan,
} from "./MasterPlanPage";
import { KALPAVRUKSHA_PLOTS } from "../data/kalpavrukshaPlots";
import type { PlotDef } from "../data/kalpavrukshaPlots";
import { ARAVINDHAM_PLOTS } from "../data/aravindhamPlots";

type WETab = "construction" | "summary";

export default function WorkExecutionUpdatesPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [activeTab, setActiveTab] = useState<WETab>("construction");
  const [activePhase, setActivePhase] = useState(CONSTRUCTION_PHASES[0].key);

  const activePlots = isAravindham(selectedProject)
    ? ARAVINDHAM_PLOTS
    : isKalpavruksha(selectedProject)
      ? KALPAVRUKSHA_PLOTS
      : ARCADIA_PLOTS;

  const activeImage = isAravindham(selectedProject)
    ? "/aravindham_masterplan.png"
    : isKalpavruksha(selectedProject)
      ? "/kalpavruksha_masterplan.png"
      : "/masterplan_colored.png";

  const projectHasMasterPlan = hasMasterPlan(selectedProject);

  // Load projects
  useEffect(() => {
    projectService.getActiveProjects().then((list: ProjectDto[]) => {
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        const arcadia = list.find((p) => p.name.toLowerCase().includes("arcadia"));
        setSelectedProject(arcadia ? arcadia.name : list[0].name);
      }
    });
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header with project selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">
          Work Execution Updates &mdash; {selectedProject}
        </h1>
        <select
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            setActiveTab("construction");
            setActivePhase(CONSTRUCTION_PHASES[0].key);
          }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs — construction phases + summary (NO Sales tab) */}
      {projectHasMasterPlan && isArcadia(selectedProject) && (
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1.5 rounded-lg">
          {CONSTRUCTION_PHASES.map((phase) => (
            <button
              key={phase.key}
              onClick={() => { setActiveTab("construction"); setActivePhase(phase.key); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${activeTab === "construction" && activePhase === phase.key ? "bg-amber-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}
            >
              {phase.label}
            </button>
          ))}
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${activeTab === "summary" ? "bg-green-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}
          >
            Summary
          </button>
        </div>
      )}

      {/* No master plan message */}
      {!projectHasMasterPlan && (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">No master plan has been configured for <strong>{selectedProject}</strong>.</p>
        </div>
      )}

      {/* Construction Map */}
      {projectHasMasterPlan && isArcadia(selectedProject) && activeTab === "construction" && (
        <ConstructionMapView
          projectName={selectedProject}
          phase={activePhase}
          plots={activePlots}
          image={activeImage}
        />
      )}

      {/* Summary */}
      {projectHasMasterPlan && isArcadia(selectedProject) && activeTab === "summary" && (
        <ConstructionSummaryView
          projectName={selectedProject}
          plots={activePlots}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CONSTRUCTION MAP VIEW                                              */
/* ------------------------------------------------------------------ */

function ConstructionMapView({
  projectName,
  phase,
  plots,
  image,
}: {
  projectName: string;
  phase: string;
  plots: PlotDef[];
  image: string;
}) {
  const [statuses, setStatuses] = useState<Map<number, VillaConstructionStatusDto>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalVilla, setModalVilla] = useState<PlotDef | null>(null);
  const [modalActivity, setModalActivity] = useState<number>(1);
  const [modalDone, setModalDone] = useState(false);
  const [modalIncharge, setModalIncharge] = useState("");
  const [modalPlannedDate, setModalPlannedDate] = useState("");
  const [modalRevisedDate, setModalRevisedDate] = useState("");
  const [modalActualDate, setModalActualDate] = useState("");

  const phaseInfo = CONSTRUCTION_PHASES.find((p) => p.key === phase)!;

  // Load statuses for this phase
  useEffect(() => {
    setLoading(true);
    villaConstructionService
      .getByPhase(projectName, phase)
      .then((list) => {
        const map = new Map<number, VillaConstructionStatusDto>();
        list.forEach((s) => map.set(s.villaNumber, s));
        setStatuses(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectName, phase]);

  const openModal = useCallback((plot: PlotDef, actIdx: number) => {
    const status = statuses.get(plot.villa);
    setModalVilla(plot);
    setModalActivity(actIdx);
    setModalDone(actIdx === 1 ? (status?.activity1Done ?? false) : (status?.activity2Done ?? false));
    setModalIncharge(status?.incharge ?? "");
    setModalPlannedDate(status?.plannedTargetDate ?? "");
    setModalRevisedDate(status?.revisedPlannedDate ?? "");
    setModalActualDate(status?.actualCompletionDate ?? "");
  }, [statuses]);

  const closeModal = useCallback(() => setModalVilla(null), []);

  const handleSave = useCallback(async () => {
    if (!modalVilla) return;
    setSaving(true);
    try {
      const updated = await villaConstructionService.updateDetails(
        projectName, modalVilla.villa, phase, modalActivity,
        modalDone, modalIncharge, modalPlannedDate, modalRevisedDate, modalActualDate
      );
      setStatuses((prev) => {
        const next = new Map(prev);
        next.set(modalVilla.villa, updated);
        return next;
      });
      closeModal();
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [projectName, phase, modalVilla, modalActivity, modalDone, modalIncharge, modalPlannedDate, modalRevisedDate, modalActualDate, closeModal]);

  // Count completed activities
  const a1Done = Array.from(statuses.values()).filter((s) => s.activity1Done).length;
  const a2Done = Array.from(statuses.values()).filter((s) => s.activity2Done).length;

  return (
    <>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs items-center">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded bg-gray-400" />
          Not Done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded bg-green-500" />
          Done
        </span>
        {!phaseInfo.single && (
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-3 rounded bg-red-600" />
            Split Line
          </span>
        )}
        <span className="text-gray-400">|</span>
        {phaseInfo.single ? (
          <span className="text-gray-600 font-medium">
            {phaseInfo.activity1}: <span className="text-green-700">{a1Done}</span>/{plots.length}
          </span>
        ) : (
          <>
            <span className="text-gray-600 font-medium">
              {phaseInfo.activity1}: <span className="text-green-700">{a1Done}</span>/{plots.length}
            </span>
            <span className="text-gray-600 font-medium">
              {phaseInfo.activity2}: <span className="text-green-700">{a2Done}</span>/{plots.length}
            </span>
          </>
        )}
        {!phaseInfo.single && (
          <span className="hidden sm:inline text-gray-400 ml-2">Click left half = {phaseInfo.activity1} &bull; Right half = {phaseInfo.activity2}</span>
        )}
        <button
          className="ml-auto px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {
            const container = document.getElementById("we-construction-map-container");
            if (!container) return;
            const w = window as any;
            const doCapture = () => {
              w.html2canvas(container, { useCORS: true, scale: 1 }).then((canvas: HTMLCanvasElement) => {
                const link = document.createElement("a");
                link.download = `work-execution-${phase}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
              });
            };
            if (w.html2canvas) { doCapture(); return; }
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
            script.onload = doCapture;
            script.onerror = () => alert("Could not load screenshot library. Use browser screenshot instead.");
            document.head.appendChild(script);
          }}
        >
          Download Screenshot
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading construction status...</div>
        </div>
      ) : (
        <div
          className="relative overflow-auto border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl bg-white"
          style={{ height: "calc(100vh - 240px)" }}
        >
          <div id="we-construction-map-container" style={{ position: "relative", width: "100%" }}>
            <img
              src={image}
              alt="Master Plan - Construction"
              className="w-full h-auto select-none"
              draggable={false}
            />

            {/* Villa overlays for construction toggling */}
            {plots.map((plot) => {
              const status = statuses.get(plot.villa);
              const a1 = status?.activity1Done ?? false;
              const a2 = status?.activity2Done ?? false;
              const isSingle = !!phaseInfo.single;

              return (
                <div
                  key={plot.villa}
                  style={{
                    position: "absolute",
                    left: `${plot.left}%`,
                    top: `${plot.top}%`,
                    width: `${plot.width}%`,
                    height: `${plot.height}%`,
                    display: "flex",
                    zIndex: 1,
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  {isSingle ? (
                    <div
                      onClick={() => openModal(plot, 1)}
                      title={`Villa ${plot.villa} - ${phaseInfo.activity1}: ${a1 ? "Done" : "Not Done"} (Click to edit)`}
                      style={{
                        width: "100%",
                        height: "100%",
                        background: a1
                          ? "rgba(34, 197, 94, 0.85)"
                          : "rgba(180, 180, 180, 0.95)",
                        border: `1px solid ${a1 ? "#16a34a" : "#999"}`,
                        cursor: "pointer",
                        transition: "background 0.2s",
                        borderRadius: "2px",
                      }}
                    />
                  ) : (
                    <>
                      <div
                        onClick={() => openModal(plot, 1)}
                        title={`Villa ${plot.villa} - ${phaseInfo.activity1}: ${a1 ? "Done" : "Not Done"} (Click to edit)`}
                        style={{
                          width: "50%",
                          height: "100%",
                          background: a1
                            ? "rgba(34, 197, 94, 0.85)"
                            : "rgba(180, 180, 180, 0.95)",
                          border: `1px solid ${a1 ? "#16a34a" : "#999"}`,
                          borderRight: "none",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          borderRadius: "2px 0 0 2px",
                        }}
                      />
                      <div
                        style={{
                          width: "2px",
                          height: "100%",
                          background: "#dc2626",
                          flexShrink: 0,
                        }}
                      />
                      <div
                        onClick={() => openModal(plot, 2)}
                        title={`Villa ${plot.villa} - ${phaseInfo.activity2}: ${a2 ? "Done" : "Not Done"} (Click to edit)`}
                        style={{
                          width: "50%",
                          height: "100%",
                          background: a2
                            ? "rgba(34, 197, 94, 0.85)"
                            : "rgba(180, 180, 180, 0.95)",
                          border: `1px solid ${a2 ? "#16a34a" : "#999"}`,
                          borderLeft: "none",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    </>
                  )}
                  {/* Villa number + details label */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                      userSelect: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      lineHeight: 1.15,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontSize: "clamp(5px, 0.7vw, 11px)", fontWeight: 800, color: "#000", textShadow: "0 0 2px rgba(255,255,255,0.8)" }}>
                      {plot.villa}
                    </span>
                    <span style={{ fontSize: "clamp(3px, 0.45vw, 7px)", fontWeight: 700, color: "#000", textShadow: "0 0 2px rgba(255,255,255,0.7)" }}>
                      {plot.sqYards} SqYd
                    </span>
                    <span style={{ fontSize: "clamp(3px, 0.4vw, 6px)", fontWeight: 700, color: "#333", textShadow: "0 0 2px rgba(255,255,255,0.7)" }}>
                      {plot.facing}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Villa Details Popup Modal */}
      {modalVilla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Villa {modalVilla.villa}</h3>
                  <p className="text-sm text-amber-100">
                    {phaseInfo.label} — {modalActivity === 1 ? phaseInfo.activity1 : phaseInfo.activity2}
                  </p>
                </div>
                <button onClick={closeModal} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-amber-100">
                <span>{modalVilla.sqYards} SqYd</span>
                <span>{modalVilla.facing}</span>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {/* Status toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <button
                  onClick={() => setModalDone(!modalDone)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    modalDone
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-gray-100 text-gray-600 border border-gray-300"
                  }`}
                >
                  {modalDone ? "Completed" : "Not Done"}
                </button>
              </div>

              {/* Incharge */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Incharge</label>
                <input
                  type="text"
                  value={modalIncharge}
                  onChange={(e) => setModalIncharge(e.target.value)}
                  placeholder="Enter incharge name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Planned Target Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Planned Target Date</label>
                <input
                  type="date"
                  value={modalPlannedDate}
                  onChange={(e) => setModalPlannedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Revised Planned Target Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Revised Planned Target Date</label>
                <input
                  type="date"
                  value={modalRevisedDate}
                  onChange={(e) => setModalRevisedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Delay in Days (auto-calculated) */}
              {modalPlannedDate && modalRevisedDate && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <label className="text-sm font-semibold text-gray-700">Delay in Days</label>
                  <span className={`text-sm font-bold ${
                    (() => {
                      const d = Math.round((new Date(modalRevisedDate).getTime() - new Date(modalPlannedDate).getTime()) / 86400000);
                      return d > 0 ? "text-red-600" : d < 0 ? "text-green-600" : "text-gray-600";
                    })()
                  }`}>
                    {(() => {
                      const d = Math.round((new Date(modalRevisedDate).getTime() - new Date(modalPlannedDate).getTime()) / 86400000);
                      return d > 0 ? `+${d} days` : d < 0 ? `${d} days (ahead)` : "On schedule";
                    })()}
                  </span>
                </div>
              )}

              {/* Actual Completion Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Actual Date of Completion</label>
                <input
                  type="date"
                  value={modalActualDate}
                  onChange={(e) => setModalActualDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  CONSTRUCTION SUMMARY VIEW                                          */
/* ------------------------------------------------------------------ */

function ConstructionSummaryView({
  projectName,
  plots,
}: {
  projectName: string;
  plots: PlotDef[];
}) {
  const [allStatuses, setAllStatuses] = useState<VillaConstructionStatusDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    villaConstructionService
      .getAllByProject(projectName)
      .then(setAllStatuses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading construction summary...</div>
      </div>
    );
  }

  // Build lookup: villaNumber -> phase -> status
  const statusMap = new Map<string, VillaConstructionStatusDto>();
  allStatuses.forEach((s) => {
    statusMap.set(`${s.villaNumber}-${s.phase}`, s);
  });

  // Calculate phase totals
  const phaseTotals = CONSTRUCTION_PHASES.map((phase) => {
    let a1Count = 0;
    let a2Count = 0;
    plots.forEach((p) => {
      const s = statusMap.get(`${p.villa}-${phase.key}`);
      if (s?.activity1Done) a1Count++;
      if (s?.activity2Done) a2Count++;
    });
    return { ...phase, a1Count, a2Count };
  });

  // Overall completion
  const totalActivities = plots.length * CONSTRUCTION_PHASES.reduce((sum, p) => sum + (p.single ? 1 : 2), 0);
  const completedActivities = phaseTotals.reduce((sum, p) => sum + p.a1Count + (p.single ? 0 : p.a2Count), 0);
  const overallPercent = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Overall Construction Progress</h3>
          <span className="text-lg font-bold text-arcadia-700">{overallPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${overallPercent}%`,
              background: overallPercent === 100 ? "#16a34a" : overallPercent > 50 ? "#f59e0b" : "#3b82f6",
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {completedActivities} of {totalActivities} activities completed across {plots.length} villas
        </p>
      </div>

      {/* Phase summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {phaseTotals.map((phase) => {
          const phaseTotal = plots.length * (phase.single ? 1 : 2);
          const phaseDone = phase.a1Count + (phase.single ? 0 : phase.a2Count);
          const pct = Math.round((phaseDone / phaseTotal) * 100);
          return (
            <div key={phase.key} className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">{phase.label}</h4>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{phase.activity1}: {phase.a1Count}/{plots.length}</span>
                {!phase.single && <span>{phase.activity2}: {phase.a2Count}/{plots.length}</span>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100 ? "#16a34a" : pct > 50 ? "#f59e0b" : "#3b82f6",
                  }}
                />
              </div>
              <div className="text-right text-xs font-bold text-gray-600 mt-1">{pct}%</div>
            </div>
          );
        })}
      </div>

      {/* Detailed villa table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Villa-wise Status</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50">Villa</th>
                {CONSTRUCTION_PHASES.map((phase) => (
                  <th key={phase.key} className="px-2 py-2 text-center font-semibold text-gray-700" colSpan={phase.single ? 1 : 2}>
                    {phase.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Status</th>
              </tr>
              <tr className="bg-gray-50 border-b">
                <th className="sticky left-0 bg-gray-50" />
                {CONSTRUCTION_PHASES.map((phase) => (
                  <React.Fragment key={phase.key}>
                    <th className="px-1 py-1 text-center text-[10px] text-gray-500 font-normal">{phase.activity1}</th>
                    {!phase.single && <th className="px-1 py-1 text-center text-[10px] text-gray-500 font-normal">{phase.activity2}</th>}
                  </React.Fragment>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {plots
                .slice()
                .sort((a, b) => a.villa - b.villa)
                .map((plot) => {
                  let doneCount = 0;
                  const totalActs = CONSTRUCTION_PHASES.reduce((sum, p) => sum + (p.single ? 1 : 2), 0);
                  CONSTRUCTION_PHASES.forEach((phase) => {
                    const s = statusMap.get(`${plot.villa}-${phase.key}`);
                    if (s?.activity1Done) doneCount++;
                    if (!phase.single && s?.activity2Done) doneCount++;
                  });
                  const isComplete = doneCount === totalActs;
                  return (
                    <tr key={plot.villa} className={`border-b hover:bg-gray-50 ${isComplete ? "bg-green-50" : ""}`}>
                      <td className="px-3 py-1.5 font-medium text-gray-800 sticky left-0 bg-white">{plot.villa}</td>
                      {CONSTRUCTION_PHASES.map((phase) => {
                        const s = statusMap.get(`${plot.villa}-${phase.key}`);
                        return (
                          <React.Fragment key={phase.key}>
                            <td className="px-1 py-1.5 text-center">
                              <span className={`inline-block w-4 h-4 rounded-sm ${s?.activity1Done ? "bg-green-500" : "bg-gray-200"}`} />
                            </td>
                            {!phase.single && (
                              <td className="px-1 py-1.5 text-center">
                                <span className={`inline-block w-4 h-4 rounded-sm ${s?.activity2Done ? "bg-green-500" : "bg-gray-200"}`} />
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                      <td className="px-3 py-1.5 text-center">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isComplete ? "bg-green-100 text-green-700" : doneCount > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                          {doneCount}/{totalActs}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
