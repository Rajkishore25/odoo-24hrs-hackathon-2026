import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';

const QuickActions = ({ role }) => {
    const navigate = useNavigate();

    const actions = {
        SUPER_ADMIN: [
            { label: 'New Payrun', onClick: () => navigate('/payroll/new') },
            { label: 'Add Employee', onClick: () => navigate('/employees/new') },
            { label: 'Generate Report', onClick: () => navigate('/reports') },
        ],
        HR_MANAGER: [
            { label: 'Add Employee', onClick: () => navigate('/employees/new') },
            { label: 'Approve Leaves', onClick: () => navigate('/time-off') },
            { label: 'Attendance', onClick: () => navigate('/attendance') },
        ],
        PAYROLL_OFFICER: [
            { label: 'New Payrun', onClick: () => navigate('/payroll/new') },
            { label: 'View Payslips', onClick: () => navigate('/payroll/payslips') },
        ],
        EMPLOYEE: [
            { label: 'Request Leave', onClick: () => navigate('/my-leave') },
            { label: 'View Attendance', onClick: () => navigate('/my-attendance') },
            { label: 'My Payslips', onClick: () => navigate('/my-payslips') },
        ],
        default: [
            { label: 'Dashboard', onClick: () => navigate('/dashboard') },
        ],
    };

    const items = actions[role] || actions.default;

    return (
        <Card title="Quick Actions">
            <div className="flex flex-col gap-2">
                {items.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </Card>
    );
};

export default QuickActions;