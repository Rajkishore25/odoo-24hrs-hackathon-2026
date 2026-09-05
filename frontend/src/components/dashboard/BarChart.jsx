import React from 'react';
import Card from '../ui/Card';

const BarChart = ({ data, title = 'Department Distribution' }) => {
    const maxValue = Math.max(...data.map(d => d.count));

    return (
        <Card title={title}>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="font-medium text-gray-800">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 rounded-full h-2.5 transition-all duration-500"
                                style={{ width: `${(item.count / maxValue) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default BarChart;