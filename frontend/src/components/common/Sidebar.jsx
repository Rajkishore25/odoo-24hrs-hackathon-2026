import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    Clock,
    CreditCard,
    FileCheck,
    Settings,
    LogOut,
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const menuItems = {
        SUPER_ADMIN: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/employees', label: 'Employees', icon: Users },
            { path: '/contracts', label: 'Contracts', icon: FileText },
            { path: '/attendance', label: 'Attendance', icon: Clock },
            { path: '/time-off', label: 'Time Off', icon: Calendar },
            { path: '/payroll', label: 'Payroll', icon: CreditCard },
            { path: '/audit', label: 'Audit', icon: FileCheck },
            { path: '/settings', label: 'Settings', icon: Settings },
        ],
        HR_MANAGER: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/employees', label: 'Employees', icon: Users },
            { path: '/contracts', label: 'Contracts', icon: FileText },
            { path: '/attendance', label: 'Attendance', icon: Clock },
            { path: '/time-off', label: 'Time Off', icon: Calendar },
        ],
        PAYROLL_OFFICER: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/payroll', label: 'Payroll', icon: CreditCard },
        ],
        LINE_MANAGER: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/attendance', label: 'Attendance', icon: Clock },
            { path: '/time-off', label: 'Time Off', icon: Calendar },
        ],
        EMPLOYEE: [
            { path: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
            { path: '/my-attendance', label: 'My Attendance', icon: Clock },
            { path: '/my-leave', label: 'My Leave', icon: Calendar },
            { path: '/my-payslips', label: 'My Payslips', icon: CreditCard },
        ],
    };

    const items = menuItems[user?.role] || menuItems.EMPLOYEE;

    return (
        <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
            <div className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-800">
                    People<span className="text-blue-600">Pay</span>360
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                            {user?.name?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.role || 'Employee'}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;