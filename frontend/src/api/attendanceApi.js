import axiosInstance from './axios';

export const attendanceApi = {
    getAttendance: (params) => axiosInstance.get('/attendance', { params }),
    checkIn: (data) => axiosInstance.post('/attendance/checkin', data),
    checkOut: (data) => axiosInstance.post('/attendance/checkout', data),
    updateAttendance: (id, data) => axiosInstance.patch(`/attendance/${id}`, data),
    getExceptions: () => axiosInstance.get('/attendance/exceptions'),
    resolveException: (id, data) => axiosInstance.patch(`/attendance/exceptions/${id}`, data),
};