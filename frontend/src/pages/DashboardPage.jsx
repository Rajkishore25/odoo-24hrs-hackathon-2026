import React, { useEffect, useState } from "react";
import { dashboardApi } from "../api/hrApi.js";
import { Users, Clock, CalendarOff, Receipt, AlertTriangle, AlertCircle, ArrowRight, Play } from "lucide-react";

export function DashboardPage({ setActiveTab }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getMetrics();
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading executive metrics...</div>
      </div>
    );
  }

  const alerts = metrics?.alerts || {};
  const currentPayrun = metrics?.currentPayrun;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Actionable Alerts Banner */}
      {(alerts.criticalPayrollIssuesCount > 0 || alerts.openAttendanceExceptionsCount > 0 || alerts.pendingLeaveCount > 0) && (
        <div
          className="glass-panel"
          style={{
            padding: 20,
            background: alerts.criticalPayrollIssuesCount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)",
            border: alerts.criticalPayrollIssuesCount > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {alerts.criticalPayrollIssuesCount > 0 ? (
                <AlertCircle size={22} color="#ef4444" />
              ) : (
                <AlertTriangle size={22} color="#f59e0b" />
              )}
              <div>
                <strong style={{ fontSize: 15, color: alerts.criticalPayrollIssuesCount > 0 ? "#fca5a5" : "#fcd34d" }}>
                  Action Required: Operational Attention Needed
                </strong>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                  {alerts.criticalPayrollIssuesCount > 0
                    ? `${alerts.criticalPayrollIssuesCount} critical payroll blocker(s) require resolution before current run can finalize.`
                    : `${alerts.openAttendanceExceptionsCount} attendance exception(s) and ${alerts.pendingLeaveCount} pending leave request(s) awaiting review.`}
                </p>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab(alerts.criticalPayrollIssuesCount > 0 ? "payruns" : "attendance")}
            >
              <span>Review Now</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Active Employees</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{metrics?.employees?.activeCount || 0}</div>
          <div style={{ fontSize: 12, color: "var(--success)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <span>● 100% active roster</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Current Payrun Status</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Receipt size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {currentPayrun ? currentPayrun.status : "No Active Run"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            {currentPayrun ? `${currentPayrun.name} (${currentPayrun.employeeCount || 0} payslips)` : "Create new run in Cockpit"}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Open Exceptions</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{alerts.openAttendanceExceptionsCount || 0}</div>
          <div style={{ fontSize: 12, color: alerts.openAttendanceExceptionsCount > 0 ? "var(--warning)" : "var(--text-muted)", marginTop: 4 }}>
            {alerts.openAttendanceExceptionsCount > 0 ? "Requires manager review" : "All punches verified"}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Pending Leave</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(14, 165, 233, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarOff size={18} color="#0ea5e9" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{alerts.pendingLeaveCount || 0}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Pending manager approval
          </div>
        </div>
      </div>

      {/* Quick Cockpit Link & Recent Payruns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Quick Launch Card */}
        <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: 10 }}>PAYROLL COCKPIT</span>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Validation & Finalization Cockpit</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Deterministic computation engine connects contracts, schedules, attendance, and leave rules to prevent erroneous payruns.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => setActiveTab("payruns")}>
              <Play size={15} />
              <span>Launch Payroll Cockpit</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab("employees")}>
              <span>View Employee Roster</span>
            </button>
          </div>
        </div>

        {/* Recent Runs Table */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Payruns</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab("payruns")}>
              View All
            </button>
          </div>

          {metrics?.recentPayruns?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {metrics.recentPayruns.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {r.periodStart.slice(0, 10)} to {r.periodEnd.slice(0, 10)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${r.status === "FINALIZED" ? "badge-success" : "badge-warning"}`}>
                      {r.status}
                    </span>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                      ₹{Number(r.totalNet || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 30 }}>
              No payruns recorded yet. Create one in the Payroll Cockpit!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
