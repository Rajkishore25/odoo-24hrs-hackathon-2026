import React, { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { Navbar } from "./components/layout/Navbar.jsx";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { EmployeesPage } from "./pages/EmployeesPage.jsx";
import { ContractsPage } from "./pages/ContractsPage.jsx";
import { AttendancePage } from "./pages/AttendancePage.jsx";
import { LeavePage } from "./pages/LeavePage.jsx";
import { SalaryStructuresPage } from "./pages/SalaryStructuresPage.jsx";
import { PayrunsPage } from "./pages/PayrunsPage.jsx";
import { EmployeePortalPage } from "./pages/EmployeePortalPage.jsx";

export function App() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
        }}
      >
        Initializing PeoplePay360...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage setActiveTab={setActiveTab} />;
      case "employees":
        return <EmployeesPage />;
      case "contracts":
        return <ContractsPage />;
      case "attendance":
        return <AttendancePage />;
      case "time-off":
        return <LeavePage />;
      case "salary-structures":
        return <SalaryStructuresPage />;
      case "payruns":
        return <PayrunsPage />;
      case "portal":
        return <EmployeePortalPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar activeTab={activeTab} />
        <main className="content-body">{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;
