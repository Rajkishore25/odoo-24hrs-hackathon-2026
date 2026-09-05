import React from 'react';

const KPICard = ({ label, value, change, color = 'blue', onClick }) => {
    const colors = {
        blue: 'border-blue-500',
        green: 'border-green-500',
        orange: 'border-orange-500',
        red: 'border-red-500',
        purple: 'border-purple-500',
    };

    return (
        <div
            className={`bg-white border-l-4 ${colors[color]} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
                </div>
                {change && (
                    <span className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {change}
                    </span>
                )}
            </div>
        </div>
    );
};

export default KPICard;