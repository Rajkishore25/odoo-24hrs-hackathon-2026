import { api } from './client';

export const authApi = {
  createAccount: (data: unknown) => api.post('/auth/create-account', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};
