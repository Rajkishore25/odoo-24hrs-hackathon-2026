import React, { useState, useEffect } from "react";
import { payrollApi } from "../api/payrollApi.js";
import { contractApi, employeeApi } from "../api/hrApi.js";
import { ValidationCockpit } from "../components/payroll/ValidationCockpit.jsx";
import { ExplainablePayslipModal } from "../components/payroll/ExplainablePayslipModal.jsx";
import { Plus, Calculator, FileCheck2, Eye, Calendar, Sparkles } from "lucide-react";

export function PayrunsPage() {
  const [payruns, setPayruns] = useState([]);
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuickFixModal, setShowQuickFixModal] = useState(false);
  const [quickFixEmp, setQuickFixEmp] = useState(null);

  // Create Payrun form
  const [newPayrunData, setNewPayrunData] = useState({
    name: "September 2026 Payroll",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-30",
  });

  // Quick Fix contract form
  const [quickFixData, setQuickFixData] = useState({
    wage: 45000,
    startDate: "2026-09-01",
    endDate: "",
  });

  const fetchPayruns = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.getPayruns();
      const items = res.data.items || [];
      setPayruns(items);

      if (items.length > 0 && !selectedPayrun) {
        selectPayrun(items[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, []);

  const selectPayrun = async (pr) => {
    try {
      const detailRes = await payrollApi.getPayrunById(pr.id);
      setSelectedPayrun(detailRes.data);

      // Fetch payslips
      const slipsRes = await payrollApi.getPayrunPayslips(pr.id);
      setPayslips(slipsRes.data || []);

      // Auto-validate payrun
      const valRes = await payrollApi.validatePayrun(pr.id);
      setValidationResult(valRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompute = async () => {
    if (!selectedPayrun) return;
    try {
      setIsComputing(true);
      await payrollApi.computePayrun(selectedPayrun.id);
      await selectPayrun(selectedPayrun);
    } catch (err) {
      alert("Compute Error: " + err.message);
    } finally {
      setIsComputing(false);
    }
  };

  const handleRevalidate = async () => {
    if (!selectedPayrun) return;
    try {
      setIsRevalidating(true);
      const res = await payrollApi.validatePayrun(selectedPayrun.id);
      setValidationResult(res.data);
    } catch (err) {
      alert("Validation Error: " + err.message);
    } finally {
      setIsRevalidating(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedPayrun) return;
    try {
      setIsFinalizing(true);
      const res = await payrollApi.finalizePayrun(selectedPayrun.id);
      alert("🎉 Payrun successfully finalized! Payslips frozen.");
      await fetchPayruns();
      await selectPayrun(selectedPayrun);
    } catch (err) {
      alert("Finalization Blocked: " + err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleCreatePayrun = async (e) => {
    e.preventDefault();
    try {
      const res = await payrollApi.createPayrun(newPayrunData);
      setShowCreateModal(false);
      await fetchPayruns();
      await selectPayrun(res.data);
    } catch (err) {
      alert("Error creating payrun: " + err.message);
    }
  };

  const handleQuickFixSubmit = async (e) => {
    e.preventDefault();
    try {
      // Fetch structures to link first available structure
      const structRes = await payrollApi.getStructures();
      const structures = structRes.data || [];
      if (structures.length === 0) {
        alert("Please create a salary structure first");
        return;
      }

      await contractApi.createContract({
        employeeId: quickFixEmp.id,
        startDate: quickFixData.startDate,
        endDate: quickFixData.endDate || null,
        wage: Number(quickFixData.wage),
        salaryStructureId: structures[0].id,
        status: "ACTIVE",
      });

      alert(`✅ Active contract assigned to ${quickFixEmp.name}! Re-running computation and validation...`);
      setShowQuickFixModal(false);

      // Recompute and revalidate
      await handleCompute();
      await handleRevalidate();
    } catch (err) {
      alert("Quick Fix Error: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Payroll Validation & Finalization Cockpit</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Deterministic rule engine ensuring 0 critical errors before salary finalization.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={15} />
          <span>New Payrun</span>
        </button>
      </div>

      {/* Main Layout: Payrun Selector & Active Cockpit */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        {/* Payrun Selector List */}
        <div className="glass-panel" style={{ padding: 16, height: "fit-content" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" }}>
            Select Payrun
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payruns.map((pr) => {
              const isSelected = selectedPayrun?.id === pr.id;
              return (
                <div
                  key={pr.id}
                  onClick={() => selectPayrun(pr)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "rgba(99, 102, 241, 0.18)" : "rgba(255, 255, 255, 0.02)",
                    border: isSelected ? "1px solid #6366f1" : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    transition: "var(--transition)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: 13.5 }}>{pr.name}</strong>
                    <span className={`badge ${pr.status === "FINALIZED" ? "badge-success" : "badge-warning"}`} style={{ fontSize: 9 }}>
                      {pr.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                    {pr.periodStart?.slice(0, 10)} to {pr.periodEnd?.slice(0, 10)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginTop: 6 }}>
                    Net: ₹{Number(pr.totalNet || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Payrun Detail Cockpit */}
        {selectedPayrun ? (
          <div>
            {/* Payrun Stats Banner */}
            <div className="glass-panel" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800 }}>{selectedPayrun.name}</h3>
                    <span className={`badge ${selectedPayrun.status === "FINALIZED" ? "badge-success" : "badge-warning"}`}>
                      {selectedPayrun.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    Period: {selectedPayrun.periodStart.slice(0, 10)} — {selectedPayrun.periodEnd.slice(0, 10)}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Total Net Payout</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--success)" }}>
                      ₹{Number(selectedPayrun.totalNet || 0).toLocaleString()}
                    </div>
                  </div>

                  {selectedPayrun.status !== "FINALIZED" && (
                    <button
                      className="btn btn-primary"
                      onClick={handleCompute}
                      disabled={isComputing}
                    >
                      <Calculator size={15} />
                      <span>{isComputing ? "Computing..." : "Compute Draft"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Cockpit (Critical Blockers & Warnings) */}
            <ValidationCockpit
              validationResult={validationResult}
              onRevalidate={handleRevalidate}
              onFinalize={handleFinalize}
              onQuickFixContract={(empId, empName) => {
                setQuickFixEmp({ id: empId, name: empName });
                setShowQuickFixModal(true);
              }}
              isFinalizing={isFinalizing}
              isRevalidating={isRevalidating}
              payrunStatus={selectedPayrun.status}
            />

            {/* Generated Payslips Table */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700 }}>
                  Payslips ({payslips.length})
                </h4>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Click any payslip to inspect explainable formula lines
                </span>
              </div>

              {payslips.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Gross</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslips.map((ps) => (
                        <tr
                          key={ps.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedPayslip(ps)}
                        >
                          <td>
                            <strong>{ps.employee?.name}</strong>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{ps.employee?.employeeCode}</div>
                          </td>
                          <td>{ps.employee?.department || "General"}</td>
                          <td>₹{Number(ps.gross).toLocaleString()}</td>
                          <td style={{ color: "var(--danger)" }}>-₹{Number(ps.totalDeductions).toLocaleString()}</td>
                          <td style={{ fontWeight: 700, color: "var(--success)" }}>₹{Number(ps.net).toLocaleString()}</td>
                          <td>
                            <span className="badge badge-success" style={{ fontSize: 10 }}>{ps.status}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayslip(ps);
                              }}
                            >
                              <Eye size={13} />
                              <span>Explain Line</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  No payslips generated yet. Click <strong>"Compute Draft"</strong> above to evaluate payroll rules.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            Select or create a payrun to view the Validation Cockpit.
          </div>
        )}
      </div>

      {/* Explainable Payslip Drawer / Modal */}
      {selectedPayslip && (
        <ExplainablePayslipModal
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}

      {/* New Payrun Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Create New Payrun</h3>
            <form onSubmit={handleCreatePayrun}>
              <div className="form-group">
                <label className="form-label">Payrun Name</label>
                <input
                  className="form-input"
                  value={newPayrunData.name}
                  onChange={(e) => setNewPayrunData({ ...newPayrunData, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Period Start</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newPayrunData.periodStart}
                    onChange={(e) => setNewPayrunData({ ...newPayrunData, periodStart: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Period End</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newPayrunData.periodEnd}
                    onChange={(e) => setNewPayrunData({ ...newPayrunData, periodEnd: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Payrun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Fix Contract Modal (For Priya Sharma in Hackathon Demo) */}
      {showQuickFixModal && (
        <div className="modal-overlay" onClick={() => setShowQuickFixModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Sparkles size={18} color="#6366f1" />
              <h3 style={{ fontSize: 18 }}>Quick Fix: Assign Active Contract</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              Assigning a valid contract to <strong>{quickFixEmp?.name}</strong> will satisfy the Validation Engine blocker.
            </p>

            <form onSubmit={handleQuickFixSubmit}>
              <div className="form-group">
                <label className="form-label">Monthly Contract Wage (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={quickFixData.wage}
                  onChange={(e) => setQuickFixData({ ...quickFixData, wage: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={quickFixData.startDate}
                    onChange={(e) => setQuickFixData({ ...quickFixData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date (Optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={quickFixData.endDate}
                    onChange={(e) => setQuickFixData({ ...quickFixData, endDate: e.target.value })}
                    placeholder="Open-ended"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuickFixModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contract & Re-validate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrunsPage;
