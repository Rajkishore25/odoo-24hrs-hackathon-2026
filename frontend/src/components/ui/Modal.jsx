import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`bg-white rounded-xl shadow-lg ${sizes[size]} w-full mx-4 ${className}`}>
                {title && (
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
};

export default Modal;