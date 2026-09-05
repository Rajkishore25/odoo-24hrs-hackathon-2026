import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';

const RecentPayruns = ({ payruns }) => {
    const navigate = useNavigate();

    return (
        <Card title="Recent Payruns">
            {payruns.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No payruns found</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Name</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Period</th>
                                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Amount</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payruns.map((payrun, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/payroll/payruns/${payrun.id}`)}
                                >
                                    <td className="py-2 px-3 text-sm font-medium text-gray-800">{payrun.name}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{payrun.period}</td>
                                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-800">
                                        ₹{(payrun.totalNet || 0).toLocaleString()}
                                    </td>
                                    <td className="py-2 px-3">
                                        <StatusBadge status={payrun.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};

export default RecentPayruns;