import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldBan, Wrench, RefreshCw, Lock } from "lucide-react";

export function ValidationCockpit({
  validationResult,
  onRevalidate,
  onFinalize,
  onQuickFixContract,
  isFinalizing,
  isRevalidating,
  payrunStatus,
}) {
  if (!validationResult) return null;

  const { status, criticalErrors = [], warnings = [], summary } = validationResult;
  const isBlocked = status === "BLOCKED" || criticalErrors.length > 0;
  const isAlreadyFinalized = payrunStatus === "FINALIZED" || payrunStatus === "PAID";

  return (
    <div className="glass-panel" style={{ padding: 24, marginBottom: 24, border: isBlocked ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: isBlocked ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isBlocked ? <ShieldBan size={24} color="#ef4444" /> : <CheckCircle2 size={24} color="#10b981" />}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                {isBlocked ? "Payroll Finalization Blocked" : "Payroll Validation Passed"}
              </h3>
              <span className={`badge ${isBlocked ? "badge-danger" : "badge-success"}`}>
                {isBlocked ? "BLOCKED" : "READY FOR FINALIZATION"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              {isBlocked
                ? `${summary.criticalCount} critical violation(s) must be resolved before payroll can be locked and disbursed.`
                : "All employee contracts and data integrity checks passed. Zero critical errors."}
            </p>
          </div>
        </div>

        {/* Cockpit Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRevalidate}
            disabled={isRevalidating}
          >
            <RefreshCw size={14} className={isRevalidating ? "spin" : ""} />
            <span>Re-validate</span>
          </button>

          {!isAlreadyFinalized && (
            <button
              className={`btn ${isBlocked ? "btn-secondary" : "btn-success"}`}
              onClick={onFinalize}
              disabled={isBlocked || isFinalizing}
              style={{
                boxShadow: isBlocked ? "none" : "0 0 15px rgba(16, 185, 129, 0.4)",
              }}
              title={isBlocked ? "Resolve all critical blockers to enable finalization" : "Lock payrun and generate payslips"}
            >
              <Lock size={15} />
              <span>{isFinalizing ? "Finalizing..." : "Finalize Payrun"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Issues Section */}
      {criticalErrors.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 10 }}>
            <AlertCircle size={15} />
            <span>CRITICAL BLOCKERS ({criticalErrors.length})</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {criticalErrors.map((err, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="badge badge-danger" style={{ fontSize: 10 }}>{err.code}</span>
                    <strong style={{ fontSize: 13.5 }}>
                      {err.employeeName ? `${err.employeeName} (${err.employeeCode || "EMP"})` : "Employee Issue"}
                    </strong>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#cbd5e1", marginTop: 4 }}>
                    {err.message}
                  </div>
                </div>

                {/* Quick Fix Button (Supports Demo Story for Priya Sharma) */}
                {err.code === "NO_ACTIVE_CONTRACT" && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onQuickFixContract(err.employeeId, err.employeeName)}
                    style={{ background: "#ef4444", borderColor: "#dc2626" }}
                  >
                    <Wrench size={13} />
                    <span>Quick Fix: Assign Contract</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 10 }}>
            <AlertTriangle size={15} />
            <span>ACTIONABLE WARNINGS ({warnings.length})</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {warnings.map((warn, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(245, 158, 11, 0.06)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span className="badge badge-warning" style={{ fontSize: 9, marginRight: 8 }}>{warn.code}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {warn.employeeName ? `${warn.employeeName}: ` : ""}
                  </span>
                  <span style={{ fontSize: 12.5, color: "#cbd5e1" }}>{warn.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ValidationCockpit;
