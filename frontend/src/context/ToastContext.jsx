import React, { createContext, useContext } from 'react';
import { Toaster, toast } from 'react-hot-toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const showToast = (message, type = 'success') => {
        switch (type) {
            case 'success':
                toast.success(message);
                break;
            case 'error':
                toast.error(message);
                break;
            case 'warning':
                toast.custom((t) => (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg shadow-lg">
                        {message}
                    </div>
                ));
                break;
            default:
                toast(message);
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toaster position="top-right" />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);