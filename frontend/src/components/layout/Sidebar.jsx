import React from "react";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Clock,
  CalendarOff,
  Coins,
  Receipt,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "Employees", icon: Users },
    { id: "contracts", label: "Contracts", icon: FileSpreadsheet },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "time-off", label: "Time Off", icon: CalendarOff },
    { id: "salary-structures", label: "Salary Structures", icon: Coins },
    { id: "payruns", label: "Payroll Cockpit", icon: Receipt, badge: "Core" },
    { id: "portal", label: "My Self-Service", icon: UserCheck },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div
        style={{
          height: 64,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(99, 102, 241, 0.5)",
          }}
        >
          <Receipt size={18} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: "#ffffff" }}>
            PeoplePay<span style={{ color: "#818cf8" }}>360</span>
          </span>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: -2, fontWeight: 600 }}>
            HACKATHON MVP
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: "16px 10px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", padding: "4px 10px", textTransform: "uppercase" }}>
          Workspace
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 12px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isActive
                  ? "linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)"
                  : "transparent",
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 500,
                fontSize: 13.5,
                cursor: "pointer",
                textAlign: "left",
                transition: "var(--transition)",
                borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
              }}
            >
              <Icon size={17} color={isActive ? "#818cf8" : "var(--text-muted)"} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span className="badge badge-danger" style={{ fontSize: 9, padding: "2px 5px" }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <ShieldAlert size={13} color="#10b981" />
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Validation Active</span>
        </div>
        <div>Deterministic Payroll Engine v1.0</div>
      </div>
    </aside>
  );
}

export default Sidebar;
