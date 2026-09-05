import React, { useState, useEffect } from "react";
import { employeeApi, contractApi } from "../api/hrApi.js";
import { payrollApi } from "../api/payrollApi.js";
import { Plus, FileSpreadsheet, ShieldCheck } from "lucide-react";

export function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    salaryStructureId: "",
    wage: 50000,
    startDate: "2026-01-01",
    endDate: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, structRes] = await Promise.all([
        employeeApi.getEmployees(),
        payrollApi.getStructures(),
      ]);

      const emps = empRes.data.items || [];
      const structs = structRes.data || [];
      setEmployees(emps);
      setStructures(structs);

      // Collect contracts from employees
      const allContracts = [];
      for (const emp of emps) {
        try {
          const cRes = await contractApi.getEmployeeContracts(emp.id);
          const empContracts = cRes.data || [];
          empContracts.forEach((c) => allContracts.push({ ...c, employee: emp }));
        } catch (e) {
          // ignore
        }
      }
      setContracts(allContracts);

      if (emps.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({
          ...prev,
          employeeId: emps[0].id,
          salaryStructureId: structs[0]?.id || "",
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await contractApi.createContract({
        ...formData,
        wage: Number(formData.wage),
        endDate: formData.endDate || null,
        status: "ACTIVE",
      });
      alert("✅ Contract created successfully!");
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Contracts & Employment Terms</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Historical contract terms, base wage, and salary structure bindings.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          <span>New Contract</span>
        </button>
      </div>

      {/* Contracts Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Period</th>
              <th>Monthly Base Wage</th>
              <th>Salary Structure</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.employee?.name}</strong>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.employee?.employeeCode}</div>
                </td>
                <td>
                  {c.startDate.slice(0, 10)} to {c.endDate ? c.endDate.slice(0, 10) : "Open-ended (Active)"}
                </td>
                <td style={{ fontWeight: 700, color: "var(--success)" }}>
                  ₹{Number(c.wage).toLocaleString()}
                </td>
                <td>{c.salaryStructure?.name || "Corporate Structure"}</td>
                <td>
                  <span className={`badge ${c.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Create Employment Contract</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Salary Structure</label>
                <select
                  className="form-select"
                  value={formData.salaryStructureId}
                  onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                  required
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base Monthly Wage (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date (Optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    placeholder="Open-ended"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractsPage;
