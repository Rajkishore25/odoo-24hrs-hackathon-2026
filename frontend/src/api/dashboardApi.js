import axiosInstance from './axios';

export const dashboardApi = {
    getDashboard: () => axiosInstance.get('/dashboard'),
    getKPIs: () => axiosInstance.get('/dashboard/kpis'),
    getAlerts: () => axiosInstance.get('/dashboard/alerts'),
};