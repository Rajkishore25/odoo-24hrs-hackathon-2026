import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
    const variants = {
        default: {
            ACTIVE: 'bg-green-100 text-green-700',
            INACTIVE: 'bg-gray-100 text-gray-700',
            PENDING: 'bg-yellow-100 text-yellow-700',
            APPROVED: 'bg-green-100 text-green-700',
            REJECTED: 'bg-red-100 text-red-700',
            DRAFT: 'bg-gray-100 text-gray-700',
            PAID: 'bg-green-100 text-green-700',
            PROCESSING: 'bg-blue-100 text-blue-700',
            ERROR: 'bg-red-100 text-red-700',
            OPEN: 'bg-yellow-100 text-yellow-700',
            CLOSED: 'bg-gray-100 text-gray-700',
        }
    };

    const getColor = (status) => {
        const colors = variants[type] || variants.default;
        return colors[status] || colors.DEFAULT || 'bg-gray-100 text-gray-700';
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColor(status)}`}>
            {status}
        </span>
    );
};

export default StatusBadge;