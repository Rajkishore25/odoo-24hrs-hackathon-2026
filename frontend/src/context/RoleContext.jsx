import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const { user } = useAuth();

    const hasRole = (roles) => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    const isHR = () => hasRole(['SUPER_ADMIN', 'HR_MANAGER']);
    const isPayroll = () => hasRole(['SUPER_ADMIN', 'PAYROLL_OFFICER']);
    const isManager = () => hasRole(['SUPER_ADMIN', 'HR_MANAGER', 'LINE_MANAGER']);
    const isEmployee = () => hasRole(['EMPLOYEE']);

    return (
        <RoleContext.Provider value={{ hasRole, isHR, isPayroll, isManager, isEmployee, role: user?.role }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);