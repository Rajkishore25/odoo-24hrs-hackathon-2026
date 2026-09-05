import { apiRequest } from "./client.js";

export const payrollApi = {
  // Salary Structures & Rules
  getStructures: () => apiRequest("/api/salary-structures"),
  createStructure: (data) => apiRequest("/api/salary-structures", { method: "POST", body: data }),
  getRules: (structureId) => apiRequest(`/api/salary-rules${structureId ? `?structureId=${structureId}` : ""}`),
  createRule: (data) => apiRequest("/api/salary-rules", { method: "POST", body: data }),

  // Payruns
  getPayruns: () => apiRequest("/api/payruns"),
  getPayrunById: (id) => apiRequest(`/api/payruns/${id}`),
  createPayrun: (data) => apiRequest("/api/payruns", { method: "POST", body: data }),
  computePayrun: (id) => apiRequest(`/api/payruns/${id}/compute`, { method: "POST" }),
  validatePayrun: (id) => apiRequest(`/api/payruns/${id}/validate`, { method: "POST" }),
  finalizePayrun: (id) => apiRequest(`/api/payruns/${id}/finalize`, { method: "POST" }),
  getPayrunPayslips: (id) => apiRequest(`/api/payruns/${id}/payslips`),

  // Payslips
  getPayslip: (id) => apiRequest(`/api/payslips/${id}`),
  getPayslipHtml: (id) => apiRequest(`/api/payslips/${id}/pdf`),
};

export default payrollApi;
