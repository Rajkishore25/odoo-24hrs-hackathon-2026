import { api } from './client';

export const employeesApi = {
  list: (params?: Record<string, string>) => api.get('/employees', { params }),
  get: (id: string) => api.get(`/employees/${id}`),
  create: (data: unknown) => api.post('/employees', data),
  update: (id: string, data: unknown) => api.patch(`/employees/${id}`, data),
  archive: (id: string) => api.delete(`/employees/${id}`),
  getContracts: (employeeId: string) => api.get(`/employees/${employeeId}/contracts`),
};
