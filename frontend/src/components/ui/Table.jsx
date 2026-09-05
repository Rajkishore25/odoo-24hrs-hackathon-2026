import React from 'react';

const Table = ({ columns, data, onRowClick, className = '' }) => {
    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`text-left py-3 px-4 text-sm font-medium text-gray-500 ${
                                    col.align === 'right' ? 'text-right' :
                                    col.align === 'center' ? 'text-center' : ''
                                }`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={index}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                                onRowClick ? 'cursor-pointer' : ''
                            }`}
                            onClick={() => onRowClick && onRowClick(row)}
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className={`py-3 px-4 text-sm text-gray-800 ${
                                        col.align === 'right' ? 'text-right' :
                                        col.align === 'center' ? 'text-center' : ''
                                    }`}
                                >
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length === 0 && (
                <div className="text-center py-8 text-gray-500">No data available</div>
            )}
        </div>
    );
};

export default Table;