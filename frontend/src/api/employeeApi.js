import axiosInstance from './axios';

export const employeeApi = {
    getEmployees: (params) => axiosInstance.get('/employees', { params }),
    getEmployee: (id) => axiosInstance.get(`/employees/${id}`),
    createEmployee: (data) => axiosInstance.post('/employees', data),
    updateEmployee: (id, data) => axiosInstance.patch(`/employees/${id}`, data),
    archiveEmployee: (id) => axiosInstance.delete(`/employees/${id}`),
};