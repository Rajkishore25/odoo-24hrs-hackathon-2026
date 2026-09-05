import React from 'react';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';

const AlertList = ({ alerts }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'CRITICAL':
                return '🔴';
            case 'WARNING':
                return '⚠️';
            case 'PENDING_LEAVES':
                return '📋';
            case 'ATTENDANCE_EXCEPTIONS':
                return '⏰';
            default:
                return 'ℹ️';
        }
    };

    return (
        <Card title="Operational Alerts">
            {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No alerts</p>
            ) : (
                <div className="space-y-2">
                    {alerts.map((alert, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <span className="text-xl">{getIcon(alert.type)}</span>
                            <span className="flex-1 text-sm text-gray-700">{alert.message}</span>
                            {alert.count && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {alert.count}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default AlertList;