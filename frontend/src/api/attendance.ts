import { api } from './client';

export const attendanceApi = {
  list: (params?: Record<string, string>) => api.get('/attendance', { params }),
  checkIn: (employeeId: string) => api.post('/attendance/checkin', { employeeId }),
  checkOut: (employeeId: string) => api.post('/attendance/checkout', { employeeId }),
  create: (data: unknown) => api.post('/attendance', data),
  update: (id: string, data: unknown) => api.patch(`/attendance/${id}`, data),
  listExceptions: (params?: Record<string, string>) =>
    api.get('/attendance/exceptions', { params }),
  updateException: (id: string, data: unknown) =>
    api.patch(`/attendance/exceptions/${id}`, data),
};
