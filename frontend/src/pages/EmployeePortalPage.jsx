import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { employeeApi, leaveApi, attendanceApi } from "../api/hrApi.js";
import { payrollApi } from "../api/payrollApi.js";
import { ExplainablePayslipModal } from "../components/payroll/ExplainablePayslipModal.jsx";
import { User, Calendar, CreditCard, Eye, Printer, ShieldCheck } from "lucide-react";

export function EmployeePortalPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState([]);
  const [myPayslips, setMyPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        // Find employee associated with current user or fallback to Rahul (EMP001)
        const empsRes = await employeeApi.getEmployees();
        const emps = empsRes.data.items || [];
        const emp = emps.find((e) => e.userId === user?.id || e.email === user?.email) || emps[0];

        if (emp) {
          setProfile(emp);
          const balRes = await leaveApi.getBalance(emp.id);
          setBalances(balRes.data || []);

          // Find payruns and employee's payslips
          const prRes = await payrollApi.getPayruns();
          const runs = prRes.data.items || [];
          const slips = [];
          for (const r of runs) {
            try {
              const sRes = await payrollApi.getPayrunPayslips(r.id);
              const matching = (sRes.data || []).find((s) => s.employeeId === emp.id);
              if (matching) slips.push({ ...matching, payrun: r });
            } catch (e) {}
          }
          setMyPayslips(slips);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        Loading employee self-service portal...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Employee Self-Service Portal</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
          Personal dashboard for {profile?.name || "Employee"} • Transparent payslip & leave access.
        </p>
      </div>

      {/* Profile & Leave Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {profile?.name?.slice(0, 1) || "E"}
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{profile?.name}</h3>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {profile?.employeeCode} • {profile?.designation} ({profile?.department})
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <div><strong>Email:</strong> {profile?.email}</div>
            <div><strong>Phone:</strong> {profile?.phone || "On file"}</div>
            <div><strong>Bank:</strong> {profile?.bankName || "HDFC Bank"} (••••{profile?.bankAccountNumber?.slice(-4) || "6789"})</div>
          </div>
        </div>

        {/* Leave Balances Card */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>My Leave Balances</h3>
          {balances.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {balances.map((b) => (
                <div
                  key={b.typeId}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <strong>{b.typeName}</strong>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Allocated: {b.allocatedDays} | Approved: {b.approvedDays}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--success)" }}>
                      {b.remainingDays}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>DAYS REMAINING</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No active allocations.</div>
          )}
        </div>
      </div>

      {/* My Payslips Table */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>My Historical Payslips</h3>

        {myPayslips.length > 0 ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pay Period</th>
                  <th>Gross Salary</th>
                  <th>Total Deductions</th>
                  <th>Net Take-Home</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myPayslips.map((ps) => (
                  <tr key={ps.id}>
                    <td>
                      <strong>{ps.payrun?.name || "Monthly Payrun"}</strong>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {ps.payrun?.periodStart?.slice(0, 10)} to {ps.payrun?.periodEnd?.slice(0, 10)}
                      </div>
                    </td>
                    <td>₹{Number(ps.gross).toLocaleString()}</td>
                    <td style={{ color: "var(--danger)" }}>-₹{Number(ps.totalDeductions).toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: "var(--success)", fontSize: 15 }}>
                      ₹{Number(ps.net).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-success">{ps.status}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPayslip(ps)}>
                          <Eye size={13} />
                          <span>View Formula</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => window.open(`/api/payslips/${ps.id}/pdf`, "_blank")}
                        >
                          <Printer size={13} />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13 }}>
            No finalized payslips available yet. Complete and finalize a payrun in the Payroll Cockpit!
          </div>
        )}
      </div>

      {/* Explainable Modal */}
      {selectedPayslip && (
        <ExplainablePayslipModal
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  );
}

export default EmployeePortalPage;
