import { api } from './client';

export const payrollApi = {
  listPayruns: (params?: Record<string, string>) => api.get('/payruns', { params }),
  getPayrun: (id: string) => api.get(`/payruns/${id}`),
  createPayrun: (data: unknown) => api.post('/payruns', data),
  computePayrun: (id: string) => api.post(`/payruns/${id}/compute`),
  validatePayrun: (id: string) => api.post(`/payruns/${id}/validate`),
  finalizePayrun: (id: string) => api.post(`/payruns/${id}/finalize`),
  getPayrunPayslips: (id: string) => api.get(`/payruns/${id}/payslips`),

  getPayslip: (id: string) => api.get(`/payslips/${id}`),
  listPayslipsForEmployee: (employeeId: string) =>
    api.get(`/payslips/employee/${employeeId}`),
  downloadPdf: (id: string) =>
    api.get(`/payslips/${id}/pdf`, { responseType: 'blob' }),

  deletePayrun: (id: string) => api.delete(`/payruns/${id}`),

  getDashboard: () => api.get('/dashboard'),
  listAuditLogs: (params?: Record<string, string>) => api.get('/audit-logs', { params }),
};
