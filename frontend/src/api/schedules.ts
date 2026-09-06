import { api } from './client';

export const schedulesApi = {
  list: () => api.get('/schedules'),
  get: (id: string) => api.get(`/schedules/${id}`),
  create: (data: unknown) => api.post('/schedules', data),
  update: (id: string, data: unknown) => api.patch(`/schedules/${id}`, data),
  getExpectedHours: (id: string, periodStart: string, periodEnd: string) =>
    api.get(`/schedules/${id}/expected-hours`, { params: { periodStart, periodEnd } }),
};
