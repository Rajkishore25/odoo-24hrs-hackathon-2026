import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi.js";

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = [
  { role: "HR_MANAGER", label: "👔 HR Manager", email: "hr@peoplepay360.com", password: "password123" },
  { role: "PAYROLL_OFFICER", label: "📊 Payroll Officer", email: "payroll@peoplepay360.com", password: "password123" },
  { role: "LINE_MANAGER", label: "👥 Line Manager", email: "manager@peoplepay360.com", password: "password123" },
  { role: "EMPLOYEE", label: "👤 Employee (Rahul)", email: "rahul@peoplepay360.com", password: "password123" },
  { role: "SUPER_ADMIN", label: "👑 Super Admin", email: "admin@peoplepay360.com", password: "password123" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("peoplepay360_token");
    const storedUser = localStorage.getItem("peoplepay360_user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("peoplepay360_token");
        localStorage.removeItem("peoplepay360_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const { accessToken, user: userData } = response.data;

    localStorage.setItem("peoplepay360_token", accessToken);
    localStorage.setItem("peoplepay360_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const fastLogin = async (role) => {
    const cred = DEMO_CREDENTIALS.find((c) => c.role === role);
    if (!cred) return;
    return login(cred.email, cred.password);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // clear local state regardless
    }
    localStorage.removeItem("peoplepay360_token");
    localStorage.removeItem("peoplepay360_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        isAuthenticated: !!user,
        loading,
        login,
        fastLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
