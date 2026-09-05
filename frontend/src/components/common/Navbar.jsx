import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Welcome back, {user?.name || 'User'}!
                </h2>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{user?.role}</span>
                <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {user?.name?.charAt(0) || 'U'}
                </span>
            </div>
        </header>
    );
};

export default Navbar;