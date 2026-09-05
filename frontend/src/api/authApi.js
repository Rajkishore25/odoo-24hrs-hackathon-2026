import axiosInstance from './axios';

export const authApi = {
    login: (data) => axiosInstance.post('/auth/login', data),
    logout: () => axiosInstance.post('/auth/logout'),
    getCurrentUser: () => axiosInstance.get('/auth/me'),
};