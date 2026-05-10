import { useState, useEffect, useCallback, useMemo } from "react";
import { projectService } from "../services/projectService";
import {
  estimationService,
  type EstimationTab,
  type EstimationRow,
  type ColumnDef,
} from "../services/estimationService";

/* ─── helpers ─── */
function parseCells(row: EstimationRow): Record<string, any> {
  try {
    return JSON.parse(row.cellsJson || "{}");
  } catch {
    return {};
  }
}

function parseCols(tab: EstimationTab): ColumnDef[] {
  try {
    return JSON.parse(tab.columnsJson || "[]");
  } catch {
    return [];
  }
}

function parseMeta(tab: EstimationTab): Record<string, any> {
  try {
    return JSON.parse(tab.metadataJson || "{}");
  } catch {
    return {};
  }
}

function fmt(n: number | undefined | null): string {
  if (n == null || isNaN(Number(n))) return "";
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtCr(n: number): string {
  return (n / 10000000).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ─── Compute tab totals (grand total row value) ─── */
function computeTabGrandTotal(tab: EstimationTab): number {
  const rows = tab.rows;
  const dataRows = rows.filter((r) => r.rowType === "DATA");
  const cols = parseCols(tab);

  if (tab.tabType === "SUMMARY") return 0;

  // For Civil tab: sum data rows → subtotal, add contingency, get grand total
  if (tab.name === "Civil & Structure") {
    let subtotal = 0;
    for (const r of dataRows) {
      const c = parseCells(r);
      if (c.formulaType) continue;
      const rate = Number(c.rate) || 0;
      const qty = Number(c.qty) || 0;
      subtotal += rate * qty * 245;
    }
    const contingencyRow = rows.find(
      (r) => parseCells(r).formulaType === "PERCENT_OF_SUBTOTAL"
    );
    const pct = contingencyRow ? Number(parseCells(contingencyRow).percent) || 5 : 5;
    return subtotal * (1 + pct / 100);
  }

  // For External Dev: sum data rows × qty × rate, add contingency
  if (tab.name === "External Development") {
    let subtotal = 0;
    for (const r of dataRows) {
      const c = parseCells(r);
      if (c.formulaType) continue;
      const qty = Number(c.qty) || 0;
      const rate = Number(c.rate) || 0;
      subtotal += qty * rate;
    }
    // Item 25 is contingency at 5% of above
    return subtotal * 1.05;
  }

  // For Approvals: sum data rows qty * rate
  if (tab.name === "Approvals & Legal") {
    let total = 0;
    for (const r of dataRows) {
      const c = parseCells(r);
      const qty = Number(c.qty) || 0;
      const rate = Number(c.rate) || 0;
      if (!isNaN(qty * rate) && qty && rate) total += qty * rate;
    }
    return total;
  }

  // Generic — use chained formula on the last formula column
  let total = 0;
  const formulaCols = cols.filter((c) => c.type === "formula" && c.formula);
  const lastFormulaCol = formulaCols.length > 0 ? formulaCols[formulaCols.length - 1] : null;
  for (const r of dataRows) {
    const c = parseCells(r);
    if (lastFormulaCol) {
      const v = evalFormulaChain(lastFormulaCol.formula || "", c, cols);
      total += v;
    }
  }
  return total;
}

/** Evaluate a formula, resolving chained column references.
 *  cols = column definitions so we can resolve formula→formula dependencies.
 *  e.g. if "total" formula = "perVilla*245" and "perVilla" formula = "rate*qty",
 *  we first compute perVilla, inject it into cells, then compute total. */
function evalFormulaChain(
  formula: string,
  cells: Record<string, any>,
  cols: ColumnDef[]
): number {
  if (!formula) return 0;
  try {
    // Build a resolved cells map with all formula columns pre-computed
    const resolved: Record<string, number> = {};
    for (const [k, v] of Object.entries(cells)) {
      resolved[k] = Number(v) || 0;
    }
    // Resolve formula columns in dependency order (simple: 2 passes)
    for (let pass = 0; pass < 3; pass++) {
      for (const col of cols) {
        if (col.type === "formula" && col.formula && !(col.key in cells)) {
          let expr = col.formula;
          for (const [rk, rv] of Object.entries(resolved)) {
            expr = expr.replace(new RegExp(`\\b${rk}\\b`, "g"), String(rv));
          }
          try {
            resolved[col.key] = Function(`"use strict"; return (${expr})`)() || 0;
          } catch { /* skip */ }
        }
      }
    }
    // Now evaluate the target formula
    let expr = formula;
    for (const [k, v] of Object.entries(resolved)) {
      expr = expr.replace(new RegExp(`\\b${k}\\b`, "g"), String(v));
    }
    return Function(`"use strict"; return (${expr})`)() || 0;
  } catch {
    return 0;
  }
}


/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */
export default function ProjectEstimationPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [tabs, setTabs] = useState<EstimationTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRows, setEditingRows] = useState<Record<number, Record<string, any>>>({});
  const [showAddTab, setShowAddTab] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [newRowSection, setNewRowSection] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ type: "row" | "tab"; id: number } | null>(null);

  // Load projects
  useEffect(() => {
    projectService.getAllProjects().then(setProjects).catch(console.error);
  }, []);

  // Load tabs when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setTabs([]);
      setActiveTabId(null);
      return;
    }
    setLoading(true);
    estimationService
      .getTabsByProject(selectedProjectId)
      .then((t) => {
        setTabs(t);
        if (t.length > 0) setActiveTabId(t[0].id!);
        else setActiveTabId(null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || null,
    [tabs, activeTabId]
  );

  const refreshTabs = useCallback(() => {
    if (!selectedProjectId) return;
    estimationService.getTabsByProject(selectedProjectId).then((t) => {
      setTabs(t);
      setEditingRows({});
    });
  }, [selectedProjectId]);

  /* ─── cell editing ─── */
  function startEdit(rowId: number, cells: Record<string, any>) {
    setEditingRows((prev) => ({ ...prev, [rowId]: { ...cells } }));
  }

  function updateEditCell(rowId: number, key: string, value: any) {
    setEditingRows((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], [key]: value },
    }));
  }

  async function saveRow(row: EstimationRow) {
    const edited = editingRows[row.id!];
    if (!edited) return;
    setSaving(true);
    try {
      await estimationService.updateRow(row.id!, {
        cellsJson: JSON.stringify(edited),
      });
      refreshTabs();
    } catch (e) {
      console.error(e);
      alert("Failed to save row");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit(rowId: number) {
    setEditingRows((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }

  /* ─── add row ─── */
  async function handleAddRow() {
    if (!activeTab) return;
    const cols = parseCols(activeTab);
    const cells: Record<string, any> = {};
    for (const col of cols) {
      if (col.type !== "formula") {
        cells[col.key] = newRowData[col.key] ?? "";
      }
    }

    // Determine the correct sortOrder: insert after the last DATA row of the selected section
    const allRows = activeTab.rows;
    let insertSortOrder = allRows.length; // default: end

    if (newRowSection) {
      // Find the last row that belongs to this section
      let lastSectionIdx = -1;
      for (let i = 0; i < allRows.length; i++) {
        if (allRows[i].sectionGroup === newRowSection && allRows[i].rowType === "DATA") {
          lastSectionIdx = i;
        }
      }
      if (lastSectionIdx >= 0) {
        // Insert right after the last data row in this section
        insertSortOrder = allRows[lastSectionIdx].sortOrder + 1;
        // Bump all rows after this point
        const rowsToUpdate: EstimationRow[] = [];
        for (const r of allRows) {
          if (r.sortOrder >= insertSortOrder) {
            rowsToUpdate.push(r);
          }
        }
        // Update sort orders of subsequent rows
        for (const r of rowsToUpdate) {
          await estimationService.updateRow(r.id!, {
            sortOrder: r.sortOrder + 1,
          });
        }
      } else {
        // Section exists but has no DATA rows yet — find the HEADER row for this section
        const headerIdx = allRows.findIndex(
          (r) => r.sectionGroup === newRowSection && r.rowType === "HEADER"
        );
        if (headerIdx >= 0) {
          insertSortOrder = allRows[headerIdx].sortOrder + 1;
          for (const r of allRows) {
            if (r.sortOrder >= insertSortOrder) {
              await estimationService.updateRow(r.id!, {
                sortOrder: r.sortOrder + 1,
              });
            }
          }
        }
      }
    }

    setSaving(true);
    try {
      await estimationService.createRow({
        tabId: activeTab.id!,
        sortOrder: insertSortOrder,
        rowType: "DATA",
        cellsJson: JSON.stringify(cells),
        sectionGroup: newRowSection || undefined,
      });

      // Now renumber all serial numbers (slno) across all DATA rows in the tab
      const updatedTabs = await estimationService.getTabsByProject(selectedProjectId!);
      const updatedTab = updatedTabs.find((t) => t.id === activeTab.id);
      if (updatedTab) {
        let slno = 1;
        for (const r of updatedTab.rows) {
          if (r.rowType === "DATA") {
            const c = parseCells(r);
            if (c.slno !== undefined && !c.formulaType) {
              if (Number(c.slno) !== slno) {
                c.slno = slno;
                await estimationService.updateRow(r.id!, {
                  cellsJson: JSON.stringify(c),
                });
              }
              slno++;
            }
          }
        }
      }

      setShowAddRow(false);
      setNewRowData({});
      setNewRowSection("");
      refreshTabs();
    } catch (e) {
      console.error(e);
      alert("Failed to add row");
    } finally {
      setSaving(false);
    }
  }

  /* ─── delete row ─── */
  async function handleDeleteRow(rowId: number) {
    setSaving(true);
    try {
      await estimationService.deleteRow(rowId);
      setConfirmDelete(null);

      // Renumber serial numbers after deletion
      if (selectedProjectId && activeTab) {
        const updatedTabs = await estimationService.getTabsByProject(selectedProjectId);
        const updatedTab = updatedTabs.find((t) => t.id === activeTab.id);
        if (updatedTab) {
          let slno = 1;
          for (const r of updatedTab.rows) {
            if (r.rowType === "DATA") {
              const c = parseCells(r);
              if (c.slno !== undefined && !c.formulaType) {
                if (Number(c.slno) !== slno) {
                  c.slno = slno;
                  await estimationService.updateRow(r.id!, {
                    cellsJson: JSON.stringify(c),
                  });
                }
                slno++;
              }
            }
          }
        }
      }
      refreshTabs();
    } catch (e) {
      console.error(e);
      alert("Failed to delete row");
    } finally {
      setSaving(false);
    }
  }

  /* ─── add tab ─── */
  async function handleAddTab() {
    if (!selectedProjectId || !newTabName.trim()) return;
    setSaving(true);
    try {
      const newTab = await estimationService.createTab({
        projectId: selectedProjectId,
        name: newTabName.trim(),
        sortOrder: tabs.length + 1,
        tabType: "DATA_TABLE",
        columnsJson: JSON.stringify([
          { key: "slno", label: "Sl.No", type: "number", width: "5%" },
          { key: "description", label: "Description", type: "text", width: "35%", editable: true },
          { key: "qty", label: "Qty", type: "number", width: "12%", editable: true },
          { key: "unit", label: "Unit", type: "text", width: "12%", editable: true },
          { key: "rate", label: "Rate (Rs)", type: "number", width: "15%", editable: true },
          { key: "total", label: "Total (Rs)", type: "formula", width: "18%", formula: "qty*rate" },
        ]),
        rows: [],
      });
      setShowAddTab(false);
      setNewTabName("");
      refreshTabs();
      setActiveTabId(newTab.id!);
    } catch (e) {
      console.error(e);
      alert("Failed to add tab");
    } finally {
      setSaving(false);
    }
  }

  /* ─── delete tab ─── */
  async function handleDeleteTab(tabId: number) {
    setSaving(true);
    try {
      await estimationService.deleteTab(tabId);
      setConfirmDelete(null);
      refreshTabs();
      if (activeTabId === tabId) setActiveTabId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete tab");
    } finally {
      setSaving(false);
    }
  }

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-arcadia-800">
          Project Cost Estimation
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          View and manage project cost estimations across multiple categories
        </p>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Project
        </label>
        <select
          className="w-full md:w-80 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
          value={selectedProjectId ?? ""}
          onChange={(e) =>
            setSelectedProjectId(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">-- Choose a project --</option>
          {projects
            .filter((p) => p.active)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading estimation data...
        </div>
      )}

      {/* Tab bar */}
      {selectedProjectId && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-gray-200 overflow-x-auto bg-gray-50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id!)}
                className={`relative px-5 py-3 text-sm font-medium whitespace-nowrap transition ${
                  activeTabId === tab.id
                    ? "text-arcadia-700 bg-white border-b-2 border-arcadia-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.name}
                {activeTabId === tab.id && tab.tabType === "CUSTOM" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ type: "tab", id: tab.id! });
                    }}
                    className="ml-2 text-red-400 hover:text-red-600 text-xs"
                    title="Delete tab"
                  >
                    x
                  </button>
                )}
              </button>
            ))}
            <button
              onClick={() => setShowAddTab(true)}
              className="px-4 py-3 text-sm text-arcadia-600 hover:bg-arcadia-50 font-medium"
              title="Add new tab"
            >
              + Add Tab
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab && activeTab.tabType === "COVER" && (
              <CoverView tab={activeTab} />
            )}
            {activeTab && activeTab.tabType === "ASSUMPTIONS" && (
              <DataTableView
                tab={activeTab}
                editingRows={editingRows}
                onStartEdit={startEdit}
                onUpdateCell={updateEditCell}
                onSaveRow={saveRow}
                onCancelEdit={cancelEdit}
                onDeleteRow={(id) => setConfirmDelete({ type: "row", id })}
                onShowAddRow={() => setShowAddRow(true)}
                saving={saving}
              />
            )}
            {activeTab &&
              (activeTab.tabType === "DATA_TABLE" ||
                activeTab.tabType === "CUSTOM") && (
                <DataTableView
                  tab={activeTab}
                  editingRows={editingRows}
                  onStartEdit={startEdit}
                  onUpdateCell={updateEditCell}
                  onSaveRow={saveRow}
                  onCancelEdit={cancelEdit}
                  onDeleteRow={(id) => setConfirmDelete({ type: "row", id })}
                  onShowAddRow={() => setShowAddRow(true)}
                  saving={saving}
                />
              )}
            {activeTab && activeTab.tabType === "SUMMARY" && (
              <SummaryView tab={activeTab} tabs={tabs} />
            )}
            {!activeTab && tabs.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No estimation data found for this project. Click "+ Add Tab" to
                get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Tab Modal */}
      {showAddTab && (
        <Modal onClose={() => setShowAddTab(false)} title="Add New Tab">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tab Name
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="e.g., Interior Finishing"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddTab(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTab}
                disabled={!newTabName.trim() || saving}
                className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Tab"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Row Modal */}
      {showAddRow && activeTab && (
        <Modal onClose={() => setShowAddRow(false)} title="Add New Row">
          <AddRowForm
            tab={activeTab}
            newRowData={newRowData}
            setNewRowData={setNewRowData}
            newRowSection={newRowSection}
            setNewRowSection={setNewRowSection}
            onSubmit={handleAddRow}
            onCancel={() => {
              setShowAddRow(false);
              setNewRowData({});
              setNewRowSection("");
            }}
            saving={saving}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <Modal
          onClose={() => setConfirmDelete(null)}
          title={`Delete ${confirmDelete.type === "tab" ? "Tab" : "Row"}`}
        >
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this{" "}
            {confirmDelete.type === "tab" ? "tab and all its rows" : "row"}?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                confirmDelete.type === "tab"
                  ? handleDeleteTab(confirmDelete.id)
                  : handleDeleteRow(confirmDelete.id)
              }
              disabled={saving}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   COVER VIEW
   ═══════════════════════════════════════════ */
function CoverView({ tab }: { tab: EstimationTab }) {
  const meta = parseMeta(tab);
  const rows = tab.rows;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-arcadia-800">
          {meta.title || "PROJECT COST ESTIMATION"}
        </h2>
        <p className="text-lg text-gray-600 mt-1">{meta.subtitle}</p>
        <p className="text-gray-500">{meta.location}</p>
      </div>

      {rows
        .filter((r) => r.rowType !== "NOTE")
        .map((row) => {
          const cells = parseCells(row);
          if (row.rowType === "HEADER") {
            return (
              <div
                key={row.id}
                className="bg-arcadia-50 px-4 py-2 mt-6 mb-2 rounded font-semibold text-arcadia-700 text-sm"
              >
                {cells.label || cells.description}
              </div>
            );
          }
          return (
            <div
              key={row.id}
              className="flex border-b border-gray-100 px-4 py-2 text-sm"
            >
              <span className="w-1/2 text-gray-600">{cells.label}</span>
              <span className="w-1/2 font-medium text-gray-800">
                {cells.value}
              </span>
            </div>
          );
        })}

      {rows
        .filter((r) => r.rowType === "NOTE")
        .map((row) => {
          const cells = parseCells(row);
          return (
            <div
              key={row.id}
              className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"
            >
              {cells.label}
            </div>
          );
        })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DATA TABLE VIEW (Civil, External, Approvals, Assumptions, Custom)
   ═══════════════════════════════════════════ */
function DataTableView({
  tab,
  editingRows,
  onStartEdit,
  onUpdateCell,
  onSaveRow,
  onCancelEdit,
  onDeleteRow,
  onShowAddRow,
  saving,
}: {
  tab: EstimationTab;
  editingRows: Record<number, Record<string, any>>;
  onStartEdit: (id: number, cells: Record<string, any>) => void;
  onUpdateCell: (id: number, key: string, val: any) => void;
  onSaveRow: (row: EstimationRow) => void;
  onCancelEdit: (id: number) => void;
  onDeleteRow: (id: number) => void;
  onShowAddRow: () => void;
  saving: boolean;
}) {
  const cols = parseCols(tab);
  const rows = tab.rows;

  // Compute all formula values for every data row, using chained formula resolution
  const dataRowTotals = useMemo(() => {
    let runningSum = 0;
    // map: rowId → { colKey → computed value }
    const map: Record<number, Record<string, number>> = {};
    for (const row of rows) {
      const cells = parseCells(row);
      if (row.rowType === "DATA" && !cells.formulaType) {
        const computed: Record<string, number> = {};
        for (const col of cols) {
          if (col.type === "formula" && col.formula) {
            computed[col.key] = evalFormulaChain(col.formula, cells, cols);
          }
        }
        map[row.id!] = computed;
        // Use the LAST formula column as the "total" for subtotal summing
        const formulaCols = cols.filter((c) => c.type === "formula" && c.formula);
        if (formulaCols.length > 0) {
          const lastFormulaCol = formulaCols[formulaCols.length - 1];
          runningSum += computed[lastFormulaCol.key] || 0;
        }
      }
    }
    return { map, subtotal: runningSum };
  }, [rows, cols]);

  // Helper: get the grand total (subtotal + contingency)
  function getGrandTotal(): number {
    const contingencyRow = rows.find(
      (r) => parseCells(r).formulaType === "PERCENT_OF_SUBTOTAL"
    );
    const pct = contingencyRow ? Number(parseCells(contingencyRow).percent) || 5 : 0;
    return pct > 0 ? dataRowTotals.subtotal * (1 + pct / 100) : dataRowTotals.subtotal;
  }

  function getCellValue(
    row: EstimationRow,
    col: ColumnDef,
    cells: Record<string, any>
  ): string | number {
    if (col.type === "formula") {
      // % of Civil Cost column
      if (col.key === "pctCivil") {
        if (row.rowType === "SUBTOTAL") return "100%";
        if (row.rowType === "TOTAL") return "";
        if (cells.formulaType) return "";
        const rowComputed = dataRowTotals.map[row.id!];
        if (!rowComputed) return "";
        // Use the "total" column value (last formula col)
        const formulaCols = cols.filter((c) => c.type === "formula" && c.formula);
        const lastCol = formulaCols[formulaCols.length - 1];
        const rowTotal = lastCol ? (rowComputed[lastCol.key] || 0) : 0;
        if (dataRowTotals.subtotal === 0) return "0%";
        return ((rowTotal / dataRowTotals.subtotal) * 100).toFixed(1) + "%";
      }

      // For SUBTOTAL/TOTAL rows — show value for each formula column
      if (row.rowType === "SUBTOTAL") {
        // Sum this specific formula column across all data rows
        let colSum = 0;
        for (const [, computed] of Object.entries(dataRowTotals.map)) {
          colSum += computed[col.key] || 0;
        }
        return fmt(colSum);
      }
      if (row.rowType === "TOTAL") {
        let colSum = 0;
        for (const [, computed] of Object.entries(dataRowTotals.map)) {
          colSum += computed[col.key] || 0;
        }
        const contingencyRow = rows.find(
          (r) => parseCells(r).formulaType === "PERCENT_OF_SUBTOTAL"
        );
        const pct = contingencyRow ? Number(parseCells(contingencyRow).percent) || 5 : 0;
        return fmt(colSum * (1 + pct / 100));
      }
      if (cells.formulaType === "PERCENT_OF_SUBTOTAL") {
        const pct = Number(cells.percent) || 5;
        // Sum this specific formula column
        let colSum = 0;
        for (const [, computed] of Object.entries(dataRowTotals.map)) {
          colSum += computed[col.key] || 0;
        }
        return fmt(colSum * (pct / 100));
      }
      if (cells.formulaType === "COST_PER_SQFT") {
        const gt = getGrandTotal();
        if (col.key === "perVilla") return fmt(gt / 245);
        return fmt(gt / 645000);
      }
      if (cells.formulaType === "COST_PER_VILLA") {
        return fmt(dataRowTotals.subtotal * 1.05 / 245);
      }
      if (cells.formulaType === "SUM_ALL") {
        return fmt(dataRowTotals.subtotal * 1.05);
      }

      // Normal formula on data row — use precomputed chained values
      const rowComputed = dataRowTotals.map[row.id!];
      if (rowComputed && col.key in rowComputed) {
        return fmt(rowComputed[col.key]);
      }
      const val = evalFormulaChain(col.formula || "", cells, cols);
      return fmt(val);
    }
    return cells[col.key] ?? "";
  }

  return (
    <div>
      {tab.subtitle && (
        <p className="text-xs text-gray-500 mb-3">{tab.subtitle}</p>
      )}

      {/* Action bar */}
      <div className="flex justify-end mb-3 gap-2">
        <button
          onClick={onShowAddRow}
          className="px-3 py-1.5 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700"
        >
          + Add Row
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-arcadia-700 text-white">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-left font-semibold text-xs"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center font-semibold text-xs w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cells = parseCells(row);
              const isEditing = editingRows[row.id!] != null;
              const editCells = editingRows[row.id!] || cells;

              // HEADER row
              if (row.rowType === "HEADER") {
                return (
                  <tr
                    key={row.id}
                    className="bg-arcadia-50 border-t-2 border-arcadia-200"
                  >
                    <td
                      colSpan={cols.length + 1}
                      className="px-3 py-2 font-bold text-arcadia-700 text-xs uppercase tracking-wide"
                    >
                      {cells.description || cells.parameter || cells.label}
                    </td>
                  </tr>
                );
              }

              // NOTE row
              if (row.rowType === "NOTE") {
                return (
                  <tr key={row.id} className="bg-gray-50">
                    <td
                      colSpan={cols.length + 1}
                      className="px-3 py-2 text-xs text-gray-500 italic"
                    >
                      {cells.description || cells.label}
                    </td>
                  </tr>
                );
              }

              // SUBTOTAL / TOTAL row
              if (
                row.rowType === "SUBTOTAL" ||
                row.rowType === "TOTAL"
              ) {
                const isBold = row.rowType === "TOTAL";
                return (
                  <tr
                    key={row.id}
                    className={`${
                      isBold
                        ? "bg-arcadia-100 border-t-2 border-arcadia-300"
                        : "bg-gray-100 border-t border-gray-300"
                    }`}
                  >
                    {cols.map((col, ci) => {
                      // Description column
                      if (col.key === "description" || col.key === "costHead") {
                        return (
                          <td
                            key={col.key}
                            colSpan={
                              cols.findIndex((c) => c.type === "formula" || c.type === "number") > ci
                                ? cols.findIndex((c) => c.type === "formula" || c.type === "number") - ci
                                : 1
                            }
                            className={`px-3 py-2 ${
                              isBold ? "font-bold text-arcadia-800" : "font-semibold text-gray-700"
                            }`}
                          >
                            {cells.description || cells.costHead}
                          </td>
                        );
                      }
                      if (col.type === "formula" || col.type === "number") {
                        return (
                          <td
                            key={col.key}
                            className={`px-3 py-2 text-right font-mono ${
                              isBold
                                ? "font-bold text-arcadia-800"
                                : "font-semibold text-gray-700"
                            }`}
                          >
                            {getCellValue(row, col, cells)}
                          </td>
                        );
                      }
                      return null;
                    })}
                    <td className="px-3 py-2"></td>
                  </tr>
                );
              }

              // DATA row
              return (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-blue-50/30 transition ${
                    isEditing ? "bg-blue-50" : ""
                  }`}
                >
                  {cols.map((col) => {
                    // Formula columns are read-only
                    if (col.type === "formula") {
                      return (
                        <td
                          key={col.key}
                          className="px-3 py-2 text-right font-mono text-gray-700"
                        >
                          {isEditing
                            ? fmt(evalFormulaChain(col.formula || "", editCells, cols))
                            : getCellValue(row, col, cells)}
                        </td>
                      );
                    }

                    // Editable cells
                    if (isEditing && (col.editable !== false || col.type === "number" || col.type === "text")) {
                      return (
                        <td key={col.key} className="px-1 py-1">
                          <input
                            type={col.type === "number" ? "number" : "text"}
                            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                            value={editCells[col.key] ?? ""}
                            onChange={(e) =>
                              onUpdateCell(
                                row.id!,
                                col.key,
                                col.type === "number"
                                  ? e.target.value === "" ? "" : Number(e.target.value)
                                  : e.target.value
                              )
                            }
                          />
                        </td>
                      );
                    }

                    // Read-only
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 ${
                          col.type === "number"
                            ? "text-right font-mono text-gray-700"
                            : "text-gray-800"
                        }`}
                      >
                        {col.type === "number" ? fmt(Number(cells[col.key])) : cells[col.key]}
                      </td>
                    );
                  })}

                  {/* Actions */}
                  <td className="px-2 py-2 text-center">
                    {isEditing ? (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => onSaveRow(row)}
                          disabled={saving}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => onCancelEdit(row.id!)}
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => onStartEdit(row.id!, cells)}
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteRow(row.id!)}
                          className="px-2 py-1 text-xs text-red-500 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          Del
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUMMARY VIEW (Grand Summary tab)
   ═══════════════════════════════════════════ */
function SummaryView({
  tab,
  tabs,
}: {
  tab: EstimationTab;
  tabs: EstimationTab[];
}) {
  const meta = parseMeta(tab);
  const rows = tab.rows;
  const totalVillas = meta.totalVillas || 245;
  const totalBuiltup = meta.totalBuiltup || 645000;

  // Compute totals from source tabs
  const tabTotals: Record<string, number> = {};
  for (const t of tabs) {
    tabTotals[t.name] = computeTabGrandTotal(t);
  }

  // Compute row values
  const rowValues: Record<number, { totalCost: number; perVilla: number; costPerSqft: number }> = {};
  let projectSubtotal = 0;

  // First pass: compute projectSubtotal from source tab rows
  for (const row of rows) {
    const cells = parseCells(row);
    if (row.rowType === "DATA" && cells.sourceTab && row.sectionGroup === "MAIN") {
      const val = tabTotals[cells.sourceTab] || 0;
      projectSubtotal += val;
      rowValues[row.id!] = {
        totalCost: val,
        perVilla: val / totalVillas,
        costPerSqft: val / totalBuiltup,
      };
    }
  }

  // Second pass: compute GST, land, and other non-MAIN rows
  for (const row of rows) {
    const cells = parseCells(row);
    if (rowValues[row.id!]) continue; // already computed in first pass
    if (row.rowType !== "DATA") continue;

    // GST row — MUST check formulaType BEFORE sourceTab since old data may have both
    if (cells.formulaType === "GST_ON_CIVIL") {
      // GST @ 5% on TOTAL PROJECT COST (Excl. Land & GST) = projectSubtotal
      const pct = Number(cells.percent) || 5;
      const val = projectSubtotal * (pct / 100);
      rowValues[row.id!] = {
        totalCost: val,
        perVilla: val / totalVillas,
        costPerSqft: val / totalBuiltup,
      };
    } else if (cells.sourceTab) {
      const val = tabTotals[cells.sourceTab] || 0;
      rowValues[row.id!] = {
        totalCost: val,
        perVilla: val / totalVillas,
        costPerSqft: val / totalBuiltup,
      };
    } else if (cells.totalCost) {
      const val = Number(cells.totalCost) || 0;
      rowValues[row.id!] = {
        totalCost: val,
        perVilla: val / totalVillas,
        costPerSqft: val / totalBuiltup,
      };
    }
  }

  // Subtotal (excl land & GST)
  const landRow = rows.find(
    (r) => r.rowType === "DATA" && parseCells(r).costHead?.includes("Land Cost")
  );
  const gstRow = rows.find(
    (r) => r.rowType === "DATA" && parseCells(r).formulaType === "GST_ON_CIVIL"
  );
  const landCost = landRow ? rowValues[landRow.id!]?.totalCost || 0 : 0;
  const gstCost = gstRow ? rowValues[gstRow.id!]?.totalCost || 0 : 0;
  const totalAllIn = projectSubtotal + landCost + gstCost;

  return (
    <div>
      {tab.subtitle && (
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-arcadia-800">
            GRAND PROJECT COST SUMMARY
          </h2>
          <p className="text-xs text-gray-500 mt-1">{tab.subtitle}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-arcadia-700 text-white">
              <th className="px-3 py-2.5 text-left w-[5%]">Sl.No</th>
              <th className="px-3 py-2.5 text-left w-[30%]">Cost Head</th>
              <th className="px-3 py-2.5 text-right w-[22%]">Total Project Cost (Rs)</th>
              <th className="px-3 py-2.5 text-right w-[20%]">Per Villa (Rs)</th>
              <th className="px-3 py-2.5 text-right w-[18%]">Cost/Sq.Ft. (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cells = parseCells(row);
              const rv = rowValues[row.id!];

              if (row.rowType === "SUBTOTAL") {
                return (
                  <tr key={row.id} className="bg-gray-100 border-t border-gray-300">
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 font-bold text-gray-700" colSpan={1}>
                      {cells.costHead}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-gray-700">
                      {fmt(projectSubtotal)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-gray-700">
                      {fmt(projectSubtotal / totalVillas)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-gray-700">
                      {fmt(projectSubtotal / totalBuiltup)}
                    </td>
                  </tr>
                );
              }

              if (row.rowType === "TOTAL") {
                return (
                  <tr
                    key={row.id}
                    className="bg-arcadia-100 border-t-2 border-arcadia-300"
                  >
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 font-bold text-arcadia-800">
                      {cells.costHead}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-arcadia-800">
                      {fmt(totalAllIn)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-arcadia-800">
                      {fmt(totalAllIn / totalVillas)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-arcadia-800">
                      {fmt(totalAllIn / totalBuiltup)}
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-blue-50/30"
                >
                  <td className="px-3 py-2 text-gray-500">
                    {cells.slno || ""}
                  </td>
                  <td className="px-3 py-2 text-gray-800">{cells.costHead}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-700">
                    {rv ? fmt(rv.totalCost) : ""}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-700">
                    {rv ? fmt(rv.perVilla) : ""}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-700">
                    {rv ? fmt(rv.costPerSqft) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary in Crores */}
      <div className="mt-6 bg-arcadia-50 rounded-xl p-5 max-w-md">
        <h3 className="font-bold text-arcadia-800 mb-3 text-sm">
          SUMMARY IN CRORES (Rs)
        </h3>
        <div className="space-y-1 text-sm">
          {tabs
            .filter(
              (t) => t.tabType !== "COVER" && t.tabType !== "ASSUMPTIONS" && t.tabType !== "SUMMARY"
            )
            .map((t) => (
              <div key={t.id} className="flex justify-between">
                <span className="text-gray-600">{t.name}</span>
                <span className="font-mono font-medium">
                  {fmtCr(tabTotals[t.name] || 0)}
                </span>
              </div>
            ))}
          <div className="flex justify-between">
            <span className="text-gray-600">Land Cost (Indicative)</span>
            <span className="font-mono font-medium">{fmtCr(landCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST on Construction</span>
            <span className="font-mono font-medium">{fmtCr(gstCost)}</span>
          </div>
          <div className="flex justify-between border-t border-arcadia-300 pt-2 mt-2">
            <span className="font-bold text-arcadia-800">TOTAL (Crores)</span>
            <span className="font-mono font-bold text-arcadia-800">
              {fmtCr(totalAllIn)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {meta.notes && meta.notes.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          {meta.notes.map((note: string, i: number) => (
            <p key={i} className="text-xs text-amber-800 mb-1">
              Note {i + 1}: {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADD ROW FORM
   ═══════════════════════════════════════════ */
function AddRowForm({
  tab,
  newRowData,
  setNewRowData,
  newRowSection,
  setNewRowSection,
  onSubmit,
  onCancel,
  saving,
}: {
  tab: EstimationTab;
  newRowData: Record<string, any>;
  setNewRowData: (d: Record<string, any>) => void;
  newRowSection: string;
  setNewRowSection: (s: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const cols = parseCols(tab);
  const sections = [
    ...new Set(tab.rows.filter((r) => r.sectionGroup).map((r) => r.sectionGroup!)),
  ];

  return (
    <div className="space-y-4">
      {sections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={newRowSection}
            onChange={(e) => setNewRowSection(e.target.value)}
          >
            <option value="">-- Select section --</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {cols
        .filter((c) => c.type !== "formula" && c.key !== "slno")
        .map((col) => (
          <div key={col.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label}
            </label>
            <input
              type={col.type === "number" ? "number" : "text"}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={newRowData[col.key] ?? ""}
              onChange={(e) =>
                setNewRowData({
                  ...newRowData,
                  [col.key]:
                    col.type === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value,
                })
              }
              placeholder={col.label}
            />
          </div>
        ))}

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={saving || (sections.length > 0 && !newRowSection)}
          className="px-4 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Row"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════ */
function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            x
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
