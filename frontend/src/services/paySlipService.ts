import api from "./api";

export interface EmployeeDto {
  id: number;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  panNo: string;
  email: string;
  phone: string;
  basicSalary: number;
  hra: number;
  specialAllowances: number;
  pfPercentage: number;
  esiPercentage: number;
  professionalTax: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  employeeId: string;
  name: string;
  designation?: string;
  department?: string;
  dateOfJoining?: string;
  panNo?: string;
  email?: string;
  phone?: string;
  basicSalary?: number;
  hra?: number;
  specialAllowances?: number;
  pfPercentage?: number;
  esiPercentage?: number;
  professionalTax?: number;
}

export interface PaySlipDto {
  id: number;
  employeeId: string;
  employeeName: string;
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
  status: string;
  sentAt: string | null;
  sentTo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaySlipRequest {
  employeeId: string;
  payMonth: string;
  workingDays: number;
  paidDate?: string;
  basic?: number;
  hra?: number;
  specialAllowances?: number;
  providentFund?: number;
  esi?: number;
  professionalTax?: number;
  tds?: number;
  advances?: number;
}

export const employeeService = {
  create: (req: CreateEmployeeRequest) =>
    api.post<EmployeeDto>("/employees", req).then((r) => r.data),

  getAll: () =>
    api.get<EmployeeDto[]>("/employees").then((r) => r.data),

  getById: (id: number) =>
    api.get<EmployeeDto>(`/employees/${id}`).then((r) => r.data),

  update: (id: number, req: CreateEmployeeRequest) =>
    api.put<EmployeeDto>(`/employees/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/employees/${id}`).then((r) => r.data),
};

export const paySlipService = {
  create: (req: CreatePaySlipRequest) =>
    api.post<PaySlipDto>("/payslips", req).then((r) => r.data),

  getAll: () =>
    api.get<PaySlipDto[]>("/payslips").then((r) => r.data),

  getByMonth: (payMonth: string) =>
    api.get<PaySlipDto[]>("/payslips/by-month", { params: { payMonth } }).then((r) => r.data),

  getByEmployee: (employeeId: string) =>
    api.get<PaySlipDto[]>("/payslips/by-employee", { params: { employeeId } }).then((r) => r.data),

  getById: (id: number) =>
    api.get<PaySlipDto>(`/payslips/${id}`).then((r) => r.data),

  update: (id: number, req: CreatePaySlipRequest) =>
    api.put<PaySlipDto>(`/payslips/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/payslips/${id}`).then((r) => r.data),

  sendEmail: (id: number, email: string) =>
    api.post(`/payslips/${id}/send-email`, null, { params: { email } }).then((r) => r.data),
};
