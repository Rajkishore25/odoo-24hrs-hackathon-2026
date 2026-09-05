import React, { useState, useEffect } from 'react';
import { employeeApi } from '../api/employeeApi';
import EmployeeList from '../components/employee/EmployeeList';
import EmployeeKanban from '../components/employee/EmployeeKanban';
import EmployeeForm from '../components/employee/EmployeeForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useModal } from '../hooks/useModal';
import { useToast } from '../hooks/useToast';

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({});
    const { isOpen, open, close } = useModal();
    const { showToast } = useToast();

    useEffect(() => {
        loadEmployees();
    }, [filters, search]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const params = { ...filters, search };
            const response = await employeeApi.getEmployees(params);
            setEmployees(response.data.data.items);
        } catch (error) {
            showToast('Failed to load employees', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeCreated = () => {
        close();
        loadEmployees();
        showToast('Employee created successfully');
    };

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
                    <p className="text-gray-500 text-sm">Manage your workforce</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView(view === 'list' ? 'kanban' : 'list')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        {view === 'list' ? 'Kanban View' : 'List View'}
                    </button>
                    <button
                        onClick={open}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        + Add Employee
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="mb-6 flex gap-4">
                <input
                    type="text"
                    placeholder="Search employees..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                >
                    <option value="">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                </select>
                <select
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
            </div>

            {/* View */}
            {view === 'list' ? (
                <EmployeeList employees={employees} onRefresh={loadEmployees} />
            ) : (
                <EmployeeKanban employees={employees} onRefresh={loadEmployees} />
            )}

            {/* Add Employee Modal */}
            <EmployeeForm
                isOpen={isOpen}
                onClose={close}
                onSuccess={handleEmployeeCreated}
            />
        </div>
    );
};

export default EmployeesPage;