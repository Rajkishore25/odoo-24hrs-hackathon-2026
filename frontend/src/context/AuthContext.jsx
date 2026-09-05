import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            authApi.getCurrentUser()
                .then((response) => {
                    setUser(response.data.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password, role) => {
        const response = await authApi.login({ email, password, role });
        const { accessToken, user } = response.data.data;
        localStorage.setItem('token', accessToken);
        setToken(accessToken);
        setUser(user);
        toast.success(`Welcome, ${user.name}!`);
        return response;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);