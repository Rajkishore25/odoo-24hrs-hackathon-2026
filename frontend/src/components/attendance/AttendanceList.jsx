import React from 'react';
import StatusBadge from '../ui/StatusBadge';

const AttendanceList = ({ attendance, onRefresh }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check In</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check Out</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Worked Hours</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.map((record) => (
                            <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm text-gray-800">
                                    {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                    {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                    {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                    {record.workedHours ? `${record.workedHours}h` : '-'}
                                </td>
                                <td className="py-3 px-4">
                                    <StatusBadge status={record.status} />
                                    {record.hasException && (
                                        <span className="ml-2 text-red-500 text-xs">⚠️</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {attendance.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No attendance records found</div>
                )}
            </div>
        </div>
    );
};

export default AttendanceList;