import { apiRequest } from "./client.js";

export const employeeApi = {
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/employees${query ? `?${query}` : ""}`);
  },
  getEmployeeById: (id) => apiRequest(`/api/employees/${id}`),
  createEmployee: (data) => apiRequest("/api/employees", { method: "POST", body: data }),
  updateEmployee: (id, data) => apiRequest(`/api/employees/${id}`, { method: "PATCH", body: data }),
};

export const contractApi = {
  getEmployeeContracts: (employeeId) => apiRequest(`/api/employees/${employeeId}/contracts`),
  createContract: (data) => apiRequest("/api/contracts", { method: "POST", body: data }),
  getApplicableContract: (employeeId, periodStart, periodEnd) =>
    apiRequest(`/api/contracts/applicable?employeeId=${employeeId}&periodStart=${periodStart}&periodEnd=${periodEnd}`),
};

export const attendanceApi = {
  getAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/attendance${query ? `?${query}` : ""}`);
  },
  checkIn: (employeeId) => apiRequest("/api/attendance/checkin", { method: "POST", body: { employeeId } }),
  checkOut: (employeeId) => apiRequest("/api/attendance/checkout", { method: "POST", body: { employeeId } }),
  getExceptions: () => apiRequest("/api/attendance/exceptions"),
  reviewException: (id, status, reason) =>
    apiRequest(`/api/attendance/exceptions/${id}`, { method: "PATCH", body: { status, reason } }),
};

export const leaveApi = {
  getTypes: () => apiRequest("/api/leave/types"),
  getAllocations: (employeeId) =>
    apiRequest(`/api/leave/allocations${employeeId ? `?employeeId=${employeeId}` : ""}`),
  getRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/leave/requests${query ? `?${query}` : ""}`);
  },
  createRequest: (data) => apiRequest("/api/leave/requests", { method: "POST", body: data }),
  approveRequest: (id) => apiRequest(`/api/leave/requests/${id}/approve`, { method: "POST" }),
  rejectRequest: (id, reason) => apiRequest(`/api/leave/requests/${id}/reject`, { method: "POST", body: { reason } }),
  getBalance: (employeeId) => apiRequest(`/api/leave/balance/${employeeId}`),
};

export const dashboardApi = {
  getMetrics: () => apiRequest("/api/dashboard"),
};
