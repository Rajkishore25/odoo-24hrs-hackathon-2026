import React, { useState } from "react";
import { useAuth, DEMO_CREDENTIALS } from "../context/AuthContext.jsx";
import { Receipt, LogIn, ShieldAlert } from "lucide-react";

export function LoginPage() {
  const { login, fastLogin } = useAuth();
  const [email, setEmail] = useState("hr@peoplepay360.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div className="glass-panel" style={{ width: "100%", maxWidth: 460, padding: 32 }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
              marginBottom: 12,
            }}
          >
            <Receipt size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>
            PeoplePay<span style={{ color: "#818cf8" }}>360</span>
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Integrated HR & Deterministic Payroll Platform
          </p>
        </div>

        {/* Demo Fast Login Buttons */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
            ONE-CLICK HACKATHON DEMO LOGIN
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DEMO_CREDENTIALS.map((c) => (
              <button
                key={c.role}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fastLogin(c.role)}
                style={{ justifyContent: "flex-start", padding: "8px 12px" }}
              >
                <span>{c.label}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                  {c.email}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>OR EMAIL SIGN IN</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "#f87171",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            <LogIn size={15} />
            <span>{loading ? "Signing in..." : "Sign In to Workspace"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
