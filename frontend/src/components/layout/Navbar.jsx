import React from "react";
import { useAuth, DEMO_CREDENTIALS } from "../../context/AuthContext.jsx";
import { LogOut, User, ShieldCheck, ChevronDown, Sparkles } from "lucide-react";

export function Navbar({ activeTab, onToggleTour, isTourActive }) {
  const { user, role, logout, fastLogin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const getRoleBadgeClass = (r) => {
    switch (r) {
      case "SUPER_ADMIN": return "badge-danger";
      case "HR_MANAGER": return "badge-info";
      case "PAYROLL_OFFICER": return "badge-warning";
      case "LINE_MANAGER": return "badge-success";
      default: return "badge-neutral";
    }
  };

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, textTransform: "capitalize" }}>
          {activeTab.replace("-", " ")}
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Hackathon Judge Demo Tour Button */}
        <button
          className={`btn ${isTourActive ? "btn-primary" : "btn-secondary"} btn-sm`}
          onClick={onToggleTour}
          style={{
            boxShadow: isTourActive ? "0 0 15px rgba(99, 102, 241, 0.4)" : "none",
            border: isTourActive ? "1px solid #818cf8" : "1px solid var(--border-subtle)",
          }}
        >
          <Sparkles size={14} color={isTourActive ? "#ffffff" : "#818cf8"} />
          <span>{isTourActive ? "Tour Active" : "⭐ Start Demo Tour"}</span>
        </button>

        {/* Quick Role Switcher for Hackathon Demo */}
        <div style={{ position: "relative" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ fontSize: 12, padding: "6px 12px" }}
          >
            <ShieldCheck size={14} color="#6366f1" />
            <span>Switch Role</span>
            <ChevronDown size={12} />
          </button>

          {dropdownOpen && (
            <div
              className="glass-panel"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 8,
                width: 220,
                zIndex: 100,
                padding: 6,
                borderRadius: 8,
                background: "#0f172a",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 8px", fontWeight: 700 }}>
                ONE-CLICK DEMO LOGIN
              </div>
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => {
                    fastLogin(cred.role);
                    setDropdownOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    padding: "7px 10px",
                    background: role === cred.role ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    color: role === cred.role ? "#818cf8" : "var(--text-primary)",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "left",
                    transition: "var(--transition)",
                  }}
                >
                  {cred.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current User Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {user?.email?.slice(0, 1).toUpperCase() || "U"}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.email?.split("@")[0]}</div>
            <span className={`badge ${getRoleBadgeClass(role)}`} style={{ fontSize: 9, padding: "2px 6px" }}>
              {role}
            </span>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          title="Logout"
          style={{ padding: 8 }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
