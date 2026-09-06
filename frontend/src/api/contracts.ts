import { api } from './client';

export const contractsApi = {
  get: (id: string) => api.get(`/contracts/${id}`),
  create: (data: unknown) => api.post('/contracts', data),
  update: (id: string, data: unknown) => api.patch(`/contracts/${id}`, data),
  getApplicable: (params: { employeeId: string; periodStart: string; periodEnd: string }) =>
    api.get('/contracts/applicable', { params }),
};
