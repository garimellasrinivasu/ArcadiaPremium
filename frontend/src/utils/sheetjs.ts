/** SheetJS from its CDN, loaded only when a spreadsheet is read or written. */
export async function loadSheetJS(): Promise<any> {
  const w = window as any;
  if (w.XLSX) return w.XLSX;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load the spreadsheet library"));
    document.head.appendChild(s);
  });
  return w.XLSX;
}

/** Downloads rows as an .xlsx with one sheet; column widths fit the content. */
export async function downloadXlsx(fileName: string, sheetName: string, rows: Record<string, unknown>[]) {
  const XLSX = await loadSheetJS();
  const ws = XLSX.utils.json_to_sheet(rows);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  ws["!cols"] = headers.map((h) => ({ wch: Math.min(60, Math.max(h.length, ...rows.map((r) => String(r[h] ?? "").length)) + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  // Build the file ourselves and click a real link — works in Safari as well as Chrome/Edge
  const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const url = URL.createObjectURL(new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.replace(/[\\/:*?"<>|]/g, "-");
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 60000);
}
