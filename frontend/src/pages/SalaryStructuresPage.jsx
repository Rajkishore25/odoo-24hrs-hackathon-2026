import React, { useState, useEffect } from "react";
import { payrollApi } from "../api/payrollApi.js";
import { Plus, Coins, ArrowDown } from "lucide-react";

export function SalaryStructuresPage() {
  const [structures, setStructures] = useState([]);
  const [selectedStruct, setSelectedStruct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const [ruleData, setRuleData] = useState({
    name: "Bonus",
    code: "BONUS",
    category: "EARNING",
    sequence: 25,
    calculationType: "FIXED",
    value: 5000,
    dependsOnCode: "",
    formulaDescription: "Fixed monthly performance bonus",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.getStructures();
      const items = res.data || [];
      setStructures(items);
      if (items.length > 0) {
        setSelectedStruct(items[0]);
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

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!selectedStruct) return;
    try {
      await payrollApi.createRule({
        ...ruleData,
        salaryStructureId: selectedStruct.id,
        sequence: Number(ruleData.sequence),
        value: Number(ruleData.value),
        dependsOnCode: ruleData.dependsOnCode || null,
      });
      alert("✅ Salary rule added!");
      setShowRuleModal(false);
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
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Salary Structures & Ordered Rules</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Sequential formula execution: Basic + Allowances - Statutory Deductions = Net Pay.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowRuleModal(true)}>
          <Plus size={15} />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* Structure Selector */}
        <div className="glass-panel" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" }}>
            Salary Structures
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {structures.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedStruct(s)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: selectedStruct?.id === s.id ? "rgba(99, 102, 241, 0.18)" : "rgba(255, 255, 255, 0.02)",
                  border: selectedStruct?.id === s.id ? "1px solid #6366f1" : "1px solid var(--border-subtle)",
                  cursor: "pointer",
                }}
              >
                <strong style={{ fontSize: 14 }}>{s.name}</strong>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  {s.description || "Standard payroll template"}
                </p>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>
                  {s.rules?.length || 0} ordered rules
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ordered Rules List */}
        {selectedStruct ? (
          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selectedStruct.name} — Execution Sequence</h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  Rules execute from lowest sequence number to highest. Later rules may reference earlier values.
                </p>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Seq</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Formula / Description</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStruct.rules?.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 800, color: "#818cf8" }}>{r.sequence}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)" }}>
                          {r.code}
                        </span>
                      </td>
                      <td><strong>{r.name}</strong></td>
                      <td>
                        <span className={`badge ${r.category === "EARNING" ? "badge-success" : "badge-danger"}`}>
                          {r.category}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{r.calculationType}</td>
                      <td style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                        {r.formulaDescription || `${r.calculationType} ${r.value || ""}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* Add Rule Modal */}
      {showRuleModal && (
        <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Add Salary Rule</h3>
            <form onSubmit={handleAddRule}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Rule Code (e.g. HRA, PF)</label>
                  <input
                    className="form-input"
                    value={ruleData.code}
                    onChange={(e) => setRuleData({ ...ruleData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rule Name</label>
                  <input
                    className="form-input"
                    value={ruleData.name}
                    onChange={(e) => setRuleData({ ...ruleData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={ruleData.category}
                    onChange={(e) => setRuleData({ ...ruleData, category: e.target.value })}
                  >
                    <option value="EARNING">EARNING</option>
                    <option value="DEDUCTION">DEDUCTION</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Calculation Type</label>
                  <select
                    className="form-select"
                    value={ruleData.calculationType}
                    onChange={(e) => setRuleData({ ...ruleData, calculationType: e.target.value })}
                  >
                    <option value="FIXED">FIXED</option>
                    <option value="PERCENTAGE">PERCENTAGE</option>
                    <option value="REFERENCE">REFERENCE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sequence (Order)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={ruleData.sequence}
                    onChange={(e) => setRuleData({ ...ruleData, sequence: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Value (Amount or %)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={ruleData.value}
                    onChange={(e) => setRuleData({ ...ruleData, value: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Depends On Code (optional)</label>
                  <input
                    className="form-input"
                    value={ruleData.dependsOnCode}
                    onChange={(e) => setRuleData({ ...ruleData, dependsOnCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. BASIC"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Formula Description</label>
                <input
                  className="form-input"
                  value={ruleData.formulaDescription}
                  onChange={(e) => setRuleData({ ...ruleData, formulaDescription: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRuleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalaryStructuresPage;
