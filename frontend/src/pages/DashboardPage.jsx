import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dashboardApi } from '../api/dashboardApi';
import KPICard from '../components/dashboard/KPICard';
import BarChart from '../components/dashboard/BarChart';
import AlertList from '../components/dashboard/AlertList';
import QuickActions from '../components/dashboard/QuickActions';
import RecentPayruns from '../components/dashboard/RecentPayruns';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await dashboardApi.getDashboard();
            setData(response.data);
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullPage />;

    const getKPIs = () => {
        const role = user?.role;
        const kpis = [];

        if (role === 'HR_MANAGER' || role === 'SUPER_ADMIN') {
            kpis.push(
                { label: 'Total Employees', value: data?.totalEmployees || 0, change: '+3 this month', color: 'blue' },
                { label: 'Active Employees', value: data?.activeEmployees || 0, color: 'green' },
                { label: 'Pending Leaves', value: data?.pendingLeaves || 0, color: 'orange' },
                { label: 'Attendance Exceptions', value: data?.attendanceExceptions || 0, color: 'red' }
            );
        } else if (role === 'PAYROLL_OFFICER') {
            kpis.push(
                { label: 'Total Payroll', value: `₹${data?.totalPayroll || 0}M`, color: 'blue' },
                { label: 'Pending Batches', value: data?.pendingBatches || 0, color: 'orange' },
                { label: 'Tax & PF', value: `₹${data?.taxContributions || 0}K`, color: 'purple' },
                { label: 'Payslips Generated', value: data?.payslipsGenerated || 0, color: 'green' }
            );
        } else if (role === 'EMPLOYEE') {
            kpis.push(
                { label: 'Present Days', value: data?.presentDays || 0, color: 'green' },
                { label: 'Leave Balance', value: data?.leaveBalance || 0, color: 'blue' },
                { label: 'Next Pay Date', value: data?.nextPayDate || '-', color: 'orange' },
                { label: 'Pending Leave', value: data?.pendingLeave || 0, color: 'red' }
            );
        }

        return kpis;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500 text-sm">
                    Overview of your HR and payroll operations
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {getKPIs().map((kpi, index) => (
                    <KPICard key={index} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <BarChart data={data?.departmentDistribution || []} />
                </div>
                <div className="lg:col-span-1">
                    <AlertList alerts={data?.alerts || []} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RecentPayruns payruns={data?.recentPayruns || []} />
                </div>
                <div className="lg:col-span-1">
                    <QuickActions role={user?.role} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;