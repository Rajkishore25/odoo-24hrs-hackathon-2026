import React from 'react';

const LoadingSpinner = ({ size = 'md', fullPage = false }) => {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
    };

    const spinner = (
        <div className="flex items-center justify-center">
            <div className={`${sizes[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
        </div>
    );

    if (fullPage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;