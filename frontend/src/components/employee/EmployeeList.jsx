import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { employeeApi } from '../../api/employeeApi';

const EmployeeList = ({ employees, onRefresh }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleArchive = async (id, name) => {
        if (window.confirm(`Are you sure you want to archive ${name}?`)) {
            try {
                await employeeApi.archiveEmployee(id);
                showToast('Employee archived successfully');
                onRefresh();
            } catch (error) {
                showToast('Failed to archive employee', 'error');
            }
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Department</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Designation</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                            {employee.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{employee.name}</p>
                                            <p className="text-sm text-gray-500">{employee.employeeCode}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">{employee.department || '-'}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">{employee.designation || '-'}</td>
                                <td className="py-3 px-4">
                                    <StatusBadge status={employee.status} />
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/employees/${employee.id}`)}
                                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => navigate(`/employees/${employee.id}/edit`)}
                                            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            Edit
                                        </button>
                                        {employee.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => handleArchive(employee.id, employee.name)}
                                                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                Archive
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {employees.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No employees found</div>
                )}
            </div>
        </div>
    );
};

export default EmployeeList;