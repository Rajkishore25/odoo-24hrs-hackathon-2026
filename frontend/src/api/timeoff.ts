import { api } from './client';

export const timeoffApi = {
  listTypes: () => api.get('/time-off/types'),
  createType: (data: unknown) => api.post('/time-off/types', data),
  listAllocations: (params?: Record<string, string>) =>
    api.get('/time-off/allocations', { params }),
  createAllocation: (data: unknown) => api.post('/time-off/allocations', data),
  listRequests: (params?: Record<string, string>) =>
    api.get('/time-off/requests', { params }),
  createRequest: (data: unknown) => api.post('/time-off/requests', data),
  approveRequest: (id: string) => api.post(`/time-off/requests/${id}/approve`),
  rejectRequest: (id: string, reason?: string) =>
    api.post(`/time-off/requests/${id}/reject`, { reason }),
  getBalance: (employeeId: string) => api.get(`/time-off/balance/${employeeId}`),
};
