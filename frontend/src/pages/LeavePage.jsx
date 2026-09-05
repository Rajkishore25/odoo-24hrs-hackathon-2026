import React, { useState, useEffect } from 'react';
import { leaveApi } from '../api/leaveApi';
import LeaveRequests from '../components/leave/LeaveRequests';
import LeaveApproval from '../components/leave/LeaveApproval';
import LeaveBalance from '../components/leave/LeaveBalance';
import LeaveRequestForm from '../components/leave/LeaveRequestForm';
import LeaveTypes from '../components/leave/LeaveTypes';
import LeaveAllocations from '../components/leave/LeaveAllocations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { useToast } from '../hooks/useToast';

const LeavePage = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [balance, setBalance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requests');
    const { isOpen, open, close } = useModal();
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [requestsRes, balanceRes] = await Promise.all([
                leaveApi.getRequests(),
                leaveApi.getBalance(user?.employeeId)
            ]);
            setRequests(requestsRes.data.data);
            setBalance(balanceRes.data.data);
        } catch (error) {
            showToast('Failed to load leave data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCreated = () => {
        close();
        loadData();
        showToast('Leave request submitted');
    };

    const tabs = [
        { id: 'requests', label: 'My Requests' },
        { id: 'balance', label: 'Balance' },
        { id: 'approval', label: 'Approvals' },
    ];

    if (user?.role === 'HR_MANAGER' || user?.role === 'SUPER_ADMIN') {
        tabs.push({ id: 'types', label: 'Leave Types' });
        tabs.push({ id: 'allocations', label: 'Allocations' });
    }

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Time Off</h1>
                    <p className="text-gray-500 text-sm">Manage leave requests</p>
                </div>
                <button
                    onClick={open}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    + Request Leave
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'requests' && (
                <LeaveRequests requests={requests} onRefresh={loadData} />
            )}
            {activeTab === 'balance' && (
                <LeaveBalance balance={balance} />
            )}
            {activeTab === 'approval' && (
                <LeaveApproval requests={requests.filter(r => r.status === 'SUBMITTED')} onRefresh={loadData} />
            )}
            {activeTab === 'types' && (
                <LeaveTypes onRefresh={loadData} />
            )}
            {activeTab === 'allocations' && (
                <LeaveAllocations onRefresh={loadData} />
            )}

            {/* Request Modal */}
            <LeaveRequestForm
                isOpen={isOpen}
                onClose={close}
                onSuccess={handleRequestCreated}
            />
        </div>
    );
};

export default LeavePage;