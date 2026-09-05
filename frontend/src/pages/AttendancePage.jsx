import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../api/attendanceApi';
import AttendanceList from '../components/attendance/AttendanceList';
import CheckInOut from '../components/attendance/CheckInOut';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const AttendancePage = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { showToast } = useToast();

    useEffect(() => {
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        setLoading(true);
        try {
            const params = {};
            if (user?.role === 'EMPLOYEE') {
                // Get employee ID from user
                const employeeId = user?.employeeId;
                if (employeeId) params.employeeId = employeeId;
            }
            const response = await attendanceApi.getAttendance(params);
            setAttendance(response.data.data);
        } catch (error) {
            showToast('Failed to load attendance', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            await attendanceApi.checkIn({ employeeId: user?.employeeId });
            showToast('Checked in successfully');
            loadAttendance();
        } catch (error) {
            showToast(error.response?.data?.error?.message || 'Check-in failed', 'error');
        }
    };

    const handleCheckOut = async () => {
        try {
            await attendanceApi.checkOut({ employeeId: user?.employeeId });
            showToast('Checked out successfully');
            loadAttendance();
        } catch (error) {
            showToast(error.response?.data?.error?.message || 'Check-out failed', 'error');
        }
    };

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
                    <p className="text-gray-500 text-sm">Track employee attendance</p>
                </div>
                <div className="flex gap-3">
                    <CheckInOut onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} />
                    <button
                        onClick={() => setView(view === 'list' ? 'calendar' : 'list')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        {view === 'list' ? 'Calendar View' : 'List View'}
                    </button>
                </div>
            </div>

            {view === 'list' ? (
                <AttendanceList attendance={attendance} onRefresh={loadAttendance} />
            ) : (
                <AttendanceCalendar
                    attendance={attendance}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                />
            )}
        </div>
    );
};

export default AttendancePage;