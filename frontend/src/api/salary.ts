import { api } from './client';

export const salaryApi = {
  listStructures: () => api.get('/salary/structures'),
  getStructure: (id: string) => api.get(`/salary/structures/${id}`),
  createStructure: (data: unknown) => api.post('/salary/structures', data),
  updateStructure: (id: string, data: unknown) => api.patch(`/salary/structures/${id}`, data),
  listRules: (structureId: string) => api.get('/salary/rules', { params: { structureId } }),
  createRule: (data: unknown) => api.post('/salary/rules', data),
  updateRule: (id: string, data: unknown) => api.patch(`/salary/rules/${id}`, data),
};
