import { useState, useEffect, useCallback } from "react";
import {
  employeeService,
  paySlipService,
  type EmployeeDto,
  type PaySlipDto,
  type CreateEmployeeRequest,
  type CreatePaySlipRequest,
} from "../services/paySlipService";

/* ─────────── number → Indian words helper ─────────── */
function numberToIndianWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const convert = (num: number): string => {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + " " + convert(num % 10);
    return ones[Math.floor(num / 100)] + " Hundred " + convert(num % 100);
  };
  const abs = Math.abs(Math.floor(n));
  let result = "";
  if (abs >= 10000000) { result += convert(Math.floor(abs / 10000000)) + "Crore "; }
  const rem1 = abs % 10000000;
  if (rem1 >= 100000) { result += convert(Math.floor(rem1 / 100000)) + "Lakh "; }
  const rem2 = rem1 % 100000;
  if (rem2 >= 1000) { result += convert(Math.floor(rem2 / 1000)) + "Thousand "; }
  const rem3 = rem2 % 1000;
  result += convert(rem3);
  return result.trim() + " only.";
}

/* ─────────── format helpers ─────────── */
const fmt = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthLabel = (m: string) => {
  if (!m) return "";
  const [y, mo] = m.split("-");
  const months = ["","JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${months[parseInt(mo)]} - ${y}`;
};

/* ─────────── Print via hidden iframe ─────────── */
function printViaIframe(html: string, filename?: string) {
  if (filename) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${filename}</title>`);
  }
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  // Wait for styles to load before printing
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
  // Fallback if onload already fired (some browsers)
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch { /* already printing */ }
  }, 500);
}

/* ═══════════════════════════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════════════════════════ */
type Tab = "employees" | "generate" | "history";

export default function PaySlipPage() {
  const [tab, setTab] = useState<Tab>("generate");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold text-arcadia-800">Pay Slips</h1>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {([
          ["employees", "Employee Master"],
          ["generate", "Generate Pay Slip"],
          ["history", "Pay Slip History"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === key
                ? "border-arcadia-600 text-arcadia-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "employees" && <EmployeeMasterTab showToast={showToast} />}
      {tab === "generate" && <GeneratePaySlipTab showToast={showToast} />}
      {tab === "history" && <PaySlipHistoryTab showToast={showToast} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPLOYEE MASTER TAB
   ═══════════════════════════════════════════════════════════════ */
function EmployeeMasterTab({ showToast }: { showToast: (m: string) => void }) {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const blank: CreateEmployeeRequest = {
    employeeId: "", name: "", designation: "", department: "",
    dateOfJoining: "", panNo: "", email: "", phone: "",
    basicSalary: 0, hra: 0, specialAllowances: 0,
    pfPercentage: 0, esiPercentage: 0, professionalTax: 0,
  };
  const [form, setForm] = useState<CreateEmployeeRequest>(blank);

  const load = useCallback(async () => {
    try {
      setEmployees(await employeeService.getAll());
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.employeeId || !form.name) return;
    try {
      if (editId) {
        await employeeService.update(editId, form);
        showToast("Employee updated");
      } else {
        await employeeService.create(form);
        showToast("Employee added");
      }
      setShowForm(false);
      setEditId(null);
      setForm(blank);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      showToast(msg);
    }
  };

  const handleEdit = (emp: EmployeeDto) => {
    setForm({
      employeeId: emp.employeeId, name: emp.name, designation: emp.designation,
      department: emp.department, dateOfJoining: emp.dateOfJoining, panNo: emp.panNo,
      email: emp.email, phone: emp.phone, basicSalary: emp.basicSalary, hra: emp.hra,
      specialAllowances: emp.specialAllowances, pfPercentage: emp.pfPercentage,
      esiPercentage: emp.esiPercentage, professionalTax: emp.professionalTax,
    });
    setEditId(emp.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deactivate this employee?")) return;
    await employeeService.delete(id);
    showToast("Employee deactivated");
    load();
  };

  const set = (k: keyof CreateEmployeeRequest, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="text-gray-500 py-8 text-center">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{employees.length} employees</p>
        <button
          onClick={() => { setForm(blank); setEditId(null); setShowForm(true); }}
          className="px-4 py-2 bg-arcadia-600 text-white text-sm rounded-lg hover:bg-arcadia-700"
        >
          + Add Employee
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-lg font-bold text-arcadia-800">{editId ? "Edit" : "Add"} Employee</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["employeeId", "Employee ID", "text"],
                ["name", "Name", "text"],
                ["designation", "Designation", "text"],
                ["department", "Department", "text"],
                ["dateOfJoining", "Date of Joining", "date"],
                ["panNo", "PAN No", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "text"],
              ] as [keyof CreateEmployeeRequest, string, string][]).map(([k, label, type]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form[k] as string) || ""}
                    onChange={(e) => set(k, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <h3 className="text-sm font-semibold text-gray-700 pt-2">Salary Components (Monthly)</h3>
            <div className="grid grid-cols-3 gap-3">
              {([
                ["basicSalary", "Basic Salary"],
                ["hra", "HRA"],
                ["specialAllowances", "Special Allowances"],
                ["pfPercentage", "PF %"],
                ["esiPercentage", "ESI %"],
                ["professionalTax", "Professional Tax"],
              ] as [keyof CreateEmployeeRequest, string][]).map(([k, label]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    value={(form[k] as number) || ""}
                    onChange={(e) => set(k, parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-arcadia-600 text-white text-sm rounded-lg hover:bg-arcadia-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-arcadia-50">
            <tr>
              {["Emp ID", "Name", "Designation", "Department", "Email", "Basic", "HRA", "Spl. Allow", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-arcadia-700 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{e.employeeId}</td>
                <td className="px-3 py-2">{e.name}</td>
                <td className="px-3 py-2">{e.designation}</td>
                <td className="px-3 py-2">{e.department}</td>
                <td className="px-3 py-2 text-xs">{e.email}</td>
                <td className="px-3 py-2 text-right">{fmt(e.basicSalary)}</td>
                <td className="px-3 py-2 text-right">{fmt(e.hra)}</td>
                <td className="px-3 py-2 text-right">{fmt(e.specialAllowances)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(e)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">No employees. Click "Add Employee" to start.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GENERATE PAY SLIP TAB
   ═══════════════════════════════════════════════════════════════ */
function GeneratePaySlipTab({ showToast }: { showToast: (m: string) => void }) {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [payMonth, setPayMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [workingDays, setWorkingDays] = useState(26);
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [basic, setBasic] = useState(0);
  const [hra, setHra] = useState(0);
  const [splAllow, setSplAllow] = useState(0);
  const [pf, setPf] = useState(0);
  const [esiAmt, setEsiAmt] = useState(0);
  const [profTax, setProfTax] = useState(0);
  const [tds, setTds] = useState(0);
  const [advances, setAdvances] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    employeeService.getAll().then(setEmployees).catch(() => {});
  }, []);

  const selectedEmp = employees.find((e) => e.employeeId === selectedEmpId);

  // Auto-fill salary when employee selected
  useEffect(() => {
    if (selectedEmp) {
      setBasic(selectedEmp.basicSalary || 0);
      setHra(selectedEmp.hra || 0);
      setSplAllow(selectedEmp.specialAllowances || 0);
      const gross = (selectedEmp.basicSalary || 0) + (selectedEmp.hra || 0) + (selectedEmp.specialAllowances || 0);
      setPf(selectedEmp.pfPercentage > 0 ? Math.round((selectedEmp.basicSalary * selectedEmp.pfPercentage) / 100) : 0);
      setEsiAmt(selectedEmp.esiPercentage > 0 ? Math.round((gross * selectedEmp.esiPercentage) / 100) : 0);
      setProfTax(selectedEmp.professionalTax || 0);
      setTds(0);
      setAdvances(0);
    }
  }, [selectedEmp]);

  const gross = basic + hra + splAllow;
  const totalDed = pf + esiAmt + profTax + tds + advances;
  const net = gross - totalDed;

  const handleGenerate = async () => {
    if (!selectedEmpId || !payMonth) { showToast("Select employee and month"); return; }
    setSaving(true);
    try {
      const req: CreatePaySlipRequest = {
        employeeId: selectedEmpId, payMonth, workingDays, paidDate,
        basic, hra, specialAllowances: splAllow,
        providentFund: pf, esi: esiAmt, professionalTax: profTax, tds, advances,
      };
      await paySlipService.create(req);
      showToast("Pay Slip generated successfully!");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to generate");
    }
    setSaving(false);
  };

  const handlePrintPreview = () => {
    if (!selectedEmp) return;
    const html = buildPaySlipHtml({
      employeeName: selectedEmp.name, employeeId: selectedEmpId,
      designation: selectedEmp.designation, department: selectedEmp.department,
      dateOfJoining: selectedEmp.dateOfJoining, panNo: selectedEmp.panNo,
      payMonth, workingDays, paidDate,
      basic, hra, specialAllowances: splAllow, grossSalary: gross,
      providentFund: pf, esi: esiAmt, professionalTax: profTax, tds, advances,
      totalDeductions: totalDed, netSalary: net,
      netSalaryInWords: numberToIndianWords(net),
    });
    const empName = selectedEmp.name.replace(/\s+/g, "_");
    const [yr, mo] = payMonth.split("-");
    const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    printViaIframe(html, `${empName}_${months[parseInt(mo)]}_${yr}`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Employee & Month */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Select Employee *</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-- Select --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.employeeId}>{e.employeeId} - {e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pay Month *</label>
          <input type="month" value={payMonth} onChange={(e) => setPayMonth(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Working Days</label>
          <input type="number" value={workingDays} onChange={(e) => setWorkingDays(parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {selectedEmp && (
        <>
          {/* Employee Info */}
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Name:</span> <strong>{selectedEmp.name}</strong></div>
            <div><span className="text-gray-500">Designation:</span> {selectedEmp.designation}</div>
            <div><span className="text-gray-500">Department:</span> {selectedEmp.department}</div>
            <div><span className="text-gray-500">PAN:</span> {selectedEmp.panNo}</div>
          </div>

          {/* Earnings & Deductions side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-green-700 border-b border-green-200 pb-1">Earnings</h3>
              {([
                ["Basic", basic, setBasic],
                ["HRA", hra, setHra],
                ["Special Allowances", splAllow, setSplAllow],
              ] as [string, number, (v: number) => void][]).map(([label, val, setter]) => (
                <div key={label} className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">{label}</label>
                  <input type="number" value={val || ""} onChange={(e) => setter(parseFloat(e.target.value) || 0)}
                    className="w-40 border border-gray-300 rounded px-3 py-1.5 text-sm text-right" />
                </div>
              ))}
              <div className="flex items-center justify-between font-bold text-green-800 border-t border-green-200 pt-2">
                <span>GROSS SALARY</span>
                <span>{fmt(gross)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-red-700 border-b border-red-200 pb-1">Deductions</h3>
              {([
                ["Provident Fund", pf, setPf],
                ["ESI", esiAmt, setEsiAmt],
                ["Professional Tax", profTax, setProfTax],
                ["TDS on Salary", tds, setTds],
                ["Advances", advances, setAdvances],
              ] as [string, number, (v: number) => void][]).map(([label, val, setter]) => (
                <div key={label} className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">{label}</label>
                  <input type="number" value={val || ""} onChange={(e) => setter(parseFloat(e.target.value) || 0)}
                    className="w-40 border border-gray-300 rounded px-3 py-1.5 text-sm text-right" />
                </div>
              ))}
              <div className="flex items-center justify-between font-bold text-red-800 border-t border-red-200 pt-2">
                <span>TOTAL DEDUCTIONS</span>
                <span>{fmt(totalDed)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-arcadia-50 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <span className="text-lg font-bold text-arcadia-800">NET SALARY: {fmt(net)}</span>
              <p className="text-xs text-gray-500 mt-0.5">Rupees In Words: {numberToIndianWords(net)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Paid Date</label>
              <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button onClick={handlePrintPreview}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
            <button onClick={handleGenerate} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-arcadia-600 hover:bg-arcadia-700 text-white rounded-lg disabled:opacity-50">
              {saving ? "Saving..." : "Save Pay Slip"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAY SLIP HISTORY TAB
   ═══════════════════════════════════════════════════════════════ */
function PaySlipHistoryTab({ showToast }: { showToast: (m: string) => void }) {
  const [slips, setSlips] = useState<PaySlipDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [emailModal, setEmailModal] = useState<{ id: number; email: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = filterMonth
        ? await paySlipService.getByMonth(filterMonth)
        : await paySlipService.getAll();
      setSlips(data);
    } catch { /* */ }
    setLoading(false);
  }, [filterMonth]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = (slip: PaySlipDto) => {
    const html = buildPaySlipHtml(slip);
    const empName = slip.employeeName.replace(/\s+/g, "_");
    const [yr, mo] = slip.payMonth.split("-");
    const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    printViaIframe(html, `${empName}_${months[parseInt(mo)]}_${yr}`);
  };

  const handleSendEmail = async () => {
    if (!emailModal) return;
    setSendingId(emailModal.id);
    try {
      await paySlipService.sendEmail(emailModal.id, emailModal.email);
      showToast("Pay Slip emailed successfully!");
      setEmailModal(null);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to send email");
    }
    setSendingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this pay slip?")) return;
    try {
      await paySlipService.delete(id);
      showToast("Deleted");
      load();
    } catch { showToast("Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Month</label>
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        {filterMonth && (
          <button onClick={() => setFilterMonth("")} className="mt-5 text-sm text-blue-600 hover:underline">Clear</button>
        )}
        <p className="mt-5 text-sm text-gray-500 ml-auto">{slips.length} records</p>
      </div>

      {/* Email modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-arcadia-800">Send Pay Slip via Email</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Employee Email</label>
              <input type="email" value={emailModal.email}
                onChange={(e) => setEmailModal({ ...emailModal, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEmailModal(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleSendEmail} disabled={sendingId !== null}
                className="px-4 py-2 bg-arcadia-600 text-white text-sm rounded-lg hover:bg-arcadia-700 disabled:opacity-50">
                {sendingId !== null ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-arcadia-50">
              <tr>
                {["Month", "Emp ID", "Name", "Gross", "Deductions", "Net Salary", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-arcadia-700 border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slips.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{monthLabel(s.payMonth)}</td>
                  <td className="px-3 py-2">{s.employeeId}</td>
                  <td className="px-3 py-2">{s.employeeName}</td>
                  <td className="px-3 py-2 text-right">{fmt(s.grossSalary)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{fmt(s.totalDeductions)}</td>
                  <td className="px-3 py-2 text-right font-bold text-green-700">{fmt(s.netSalary)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === "SENT" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => handlePrint(s)} className="text-blue-600 hover:underline text-xs">Print</button>
                      <button onClick={() => setEmailModal({ id: s.id, email: s.sentTo || "" })}
                        className="text-purple-600 hover:underline text-xs">Email</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {slips.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No pay slips found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAY SLIP HTML BUILDER (matches the uploaded DOCX template)
   ═══════════════════════════════════════════════════════════════ */
interface PaySlipData {
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  panNo: string;
  payMonth: string;
  workingDays: number;
  paidDate: string;
  basic: number;
  hra: number;
  specialAllowances: number;
  grossSalary: number;
  providentFund: number;
  esi: number;
  professionalTax: number;
  tds: number;
  advances: number;
  totalDeductions: number;
  netSalary: number;
  netSalaryInWords: string;
}

function buildPaySlipHtml(data: PaySlipData): string {
  const doj = data.dateOfJoining
    ? new Date(data.dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";
  const pd = data.paidDate
    ? new Date(data.paidDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pay Slip</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #222; }
  .container { border: 2px solid #1e3a5f; padding: 0; max-width: 700px; margin: auto; }
  .header { background: #1e3a5f; color: #fff; text-align: center; padding: 12px; font-size: 14px; font-weight: bold; letter-spacing: 1px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #ccc; }
  .info-cell { padding: 6px 12px; border-bottom: 1px solid #e5e5e5; display: flex; }
  .info-cell .label { width: 140px; font-weight: bold; color: #444; flex-shrink: 0; }
  .info-cell .value { color: #111; }
  .salary-table { width: 100%; border-collapse: collapse; }
  .salary-table th { background: #1e3a5f; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; }
  .salary-table td { padding: 6px 12px; border-bottom: 1px solid #e5e5e5; }
  .salary-table .amount { text-align: right; font-family: 'Courier New', monospace; }
  .salary-table .total-row td { background: #f0f4f8; font-weight: bold; border-top: 2px solid #1e3a5f; }
  .net-row td { background: #1e3a5f !important; color: #fff !important; font-weight: bold; font-size: 13px; border: none !important; }
  .words { padding: 10px 12px; font-style: italic; color: #333; border-top: 1px solid #ccc; }
  .footer { padding: 30px 12px 12px; text-align: right; }
  .footer .company { font-weight: bold; color: #1e3a5f; font-size: 12px; }
  .footer .sign { margin-top: 30px; font-weight: bold; font-size: 11px; color: #444; }
</style>
</head><body>
<div class="container">
  <div class="header">PAY SLIP FOR THE MONTH OF ${monthLabel(data.payMonth)}</div>
  <div class="info-grid">
    <div class="info-cell"><span class="label">Name of Employee:</span><span class="value">${data.employeeName}</span></div>
    <div class="info-cell"><span class="label">Employee ID:</span><span class="value">${data.employeeId}</span></div>
    <div class="info-cell"><span class="label">Designation:</span><span class="value">${data.designation}</span></div>
    <div class="info-cell"><span class="label">Date of Joining:</span><span class="value">${doj}</span></div>
    <div class="info-cell"><span class="label">Department:</span><span class="value">${data.department}</span></div>
    <div class="info-cell"><span class="label">Working Days:</span><span class="value">${data.workingDays}</span></div>
    <div class="info-cell"><span class="label">PAN No:</span><span class="value">${data.panNo}</span></div>
    <div class="info-cell"><span class="label">Paid Date:</span><span class="value">${pd}</span></div>
  </div>
  <table class="salary-table">
    <thead>
      <tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
      <tr><th>Description</th><th style="text-align:right">Amount</th><th>Description</th><th style="text-align:right">Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>BASIC</td><td class="amount">${fmt(data.basic)}</td>
        <td>PROVIDENT FUND</td><td class="amount">${fmt(data.providentFund)}</td>
      </tr>
      <tr>
        <td>HRA</td><td class="amount">${fmt(data.hra)}</td>
        <td>ESI</td><td class="amount">${fmt(data.esi)}</td>
      </tr>
      <tr>
        <td>SPECIAL ALLOWANCES</td><td class="amount">${fmt(data.specialAllowances)}</td>
        <td>PROFESSIONAL TAX</td><td class="amount">${fmt(data.professionalTax)}</td>
      </tr>
      <tr>
        <td></td><td></td>
        <td>TDS On Salary</td><td class="amount">${fmt(data.tds)}</td>
      </tr>
      <tr>
        <td></td><td></td>
        <td>Advances</td><td class="amount">${fmt(data.advances)}</td>
      </tr>
      <tr class="total-row">
        <td>GROSS SALARY</td><td class="amount">${fmt(data.grossSalary)}</td>
        <td>TOTAL DEDUCTIONS</td><td class="amount">${fmt(data.totalDeductions)}</td>
      </tr>
      <tr class="net-row">
        <td colspan="2">NET SALARY</td>
        <td colspan="2" class="amount" style="text-align:right;font-size:14px">${fmt(data.netSalary)}</td>
      </tr>
    </tbody>
  </table>
  <div class="words">Rupees In Words: <strong>${data.netSalaryInWords || numberToIndianWords(data.netSalary)}</strong></div>
  <div class="footer">
    <div class="company">For PRANEETH ARCADIA PROPERTIES</div>
    <div class="sign">Authorised Signatory</div>
  </div>
</div>
</body></html>`;
}
