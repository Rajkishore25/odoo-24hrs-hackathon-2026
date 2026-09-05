

import axiosInstance from './axios';

export const leaveApi = {
    getLeaveTypes: () => axiosInstance.get('/leave/types'),
    createLeaveType: (data) => axiosInstance.post('/leave/types', data),
    getAllocations: (params) => axiosInstance.get('/leave/allocations', { params }),
    createAllocation: (data) => axiosInstance.post('/leave/allocations', data),
    getRequests: (params) => axiosInstance.get('/leave/requests', { params }),
    createRequest: (data) => axiosInstance.post('/leave/requests', data),
    approveRequest: (id) => axiosInstance.patch(`/leave/requests/${id}/approve`),
    rejectRequest: (id, data) => axiosInstance.patch(`/leave/requests/${id}/reject`, data),
    getBalance: (employeeId) => axiosInstance.get(`/leave/balance/${employeeId}`),
};