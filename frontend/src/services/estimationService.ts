import api from "./api";

export interface EstimationRow {
  id?: number;
  tabId?: number;
  sortOrder: number;
  rowType: string; // HEADER | DATA | SUBTOTAL | TOTAL | NOTE
  cellsJson: string;
  sectionGroup?: string;
}

export interface EstimationTab {
  id?: number;
  projectId: number;
  name: string;
  subtitle?: string;
  sortOrder: number;
  tabType: string; // COVER | ASSUMPTIONS | DATA_TABLE | SUMMARY | CUSTOM
  columnsJson: string;
  metadataJson?: string;
  rows: EstimationRow[];
}

export interface ColumnDef {
  key: string;
  label: string;
  type: string; // text | number | formula
  width?: string;
  editable?: boolean;
  formula?: string;
}

export const estimationService = {
  getTabsByProject: (projectId: number) =>
    api.get<EstimationTab[]>(`/estimation/tabs/project/${projectId}`).then((r) => r.data),

  getTab: (tabId: number) =>
    api.get<EstimationTab>(`/estimation/tabs/${tabId}`).then((r) => r.data),

  createTab: (tab: Partial<EstimationTab>) =>
    api.post<EstimationTab>("/estimation/tabs", tab).then((r) => r.data),

  updateTab: (tabId: number, tab: Partial<EstimationTab>) =>
    api.put<EstimationTab>(`/estimation/tabs/${tabId}`, tab).then((r) => r.data),

  deleteTab: (tabId: number) =>
    api.delete(`/estimation/tabs/${tabId}`),

  createRow: (row: Partial<EstimationRow>) =>
    api.post<EstimationRow>("/estimation/rows", row).then((r) => r.data),

  updateRow: (rowId: number, row: Partial<EstimationRow>) =>
    api.put<EstimationRow>(`/estimation/rows/${rowId}`, row).then((r) => r.data),

  deleteRow: (rowId: number) =>
    api.delete(`/estimation/rows/${rowId}`),

  bulkSaveRows: (tabId: number, rows: EstimationRow[]) =>
    api.put<EstimationTab>(`/estimation/tabs/${tabId}/rows`, rows).then((r) => r.data),
};
