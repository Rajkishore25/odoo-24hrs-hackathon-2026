import React, { useState } from "react";
import { X, Printer, HelpCircle, ChevronRight, ChevronDown, CheckCircle, CreditCard, Building } from "lucide-react";

export function ExplainablePayslipModal({ payslip, onClose }) {
  const [expandedLine, setExpandedLine] = useState(null);

  if (!payslip) return null;

  const earnings = payslip.lines?.filter((l) => l.category === "EARNING") || [];
  const deductions = payslip.lines?.filter((l) => l.category === "DEDUCTION") || [];

  const handlePrint = () => {
    window.open(`/api/payslips/${payslip.id}/pdf`, "_blank");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 680, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Explainable Payslip</h3>
              <span className="badge badge-success">{payslip.status}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              ID: {payslip.id}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 20, overflowY: "auto", maxHeight: "75vh" }}>
          {/* Employee Info Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{payslip.employee?.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Code: {payslip.employee?.employeeCode} • {payslip.employee?.designation}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Dept: {payslip.employee?.department || "General"}
              </div>
            </div>

            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
                <Building size={12} />
                <span>Bank: {payslip.employee?.bankName || "Direct Deposit"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
                <CreditCard size={12} />
                <span>A/C: {payslip.employee?.bankAccountNumber ? `••••${payslip.employee.bankAccountNumber.slice(-4)}` : "Verified"}</span>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Earnings Column */}
            <div>
              <h4 style={{ fontSize: 13, color: "var(--success)", marginBottom: 10, fontWeight: 700 }}>
                EARNINGS (GROSS: ₹{Number(payslip.gross).toLocaleString()})
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {earnings.map((line) => (
                  <div
                    key={line.id || line.code}
                    onClick={() => setExpandedLine(expandedLine === line.code ? null : line.code)}
                    style={{
                      background: "rgba(16, 185, 129, 0.04)",
                      border: "1px solid rgba(16, 185, 129, 0.15)",
                      borderRadius: "var(--radius-md)",
                      padding: 10,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {expandedLine === line.code ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{line.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>
                        ₹{Number(line.amount).toLocaleString()}
                      </span>
                    </div>

                    {expandedLine === line.code && (
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: 11.5,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <div><strong>Formula:</strong> {line.formulaDescription || "Fixed Amount"}</div>
                        {line.inputValues && Object.keys(line.inputValues).length > 0 && (
                          <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", color: "#a5b4fc" }}>
                            Inputs: {JSON.stringify(line.inputValues)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions Column */}
            <div>
              <h4 style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10, fontWeight: 700 }}>
                DEDUCTIONS (TOTAL: ₹{Number(payslip.totalDeductions).toLocaleString()})
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {deductions.map((line) => (
                  <div
                    key={line.id || line.code}
                    onClick={() => setExpandedLine(expandedLine === line.code ? null : line.code)}
                    style={{
                      background: "rgba(239, 68, 68, 0.04)",
                      border: "1px solid rgba(239, 68, 68, 0.15)",
                      borderRadius: "var(--radius-md)",
                      padding: 10,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {expandedLine === line.code ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{line.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>
                        ₹{Number(line.amount).toLocaleString()}
                      </span>
                    </div>

                    {expandedLine === line.code && (
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: 11.5,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <div><strong>Formula:</strong> {line.formulaDescription || "Statutory Deduction"}</div>
                        {line.inputValues && Object.keys(line.inputValues).length > 0 && (
                          <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", color: "#fca5a5" }}>
                            Inputs: {JSON.stringify(line.inputValues)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Net Salary Highlight */}
          <div
            style={{
              marginTop: 24,
              padding: "16px 20px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase" }}>
                Net Take-Home Salary
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Gross ₹{Number(payslip.gross).toLocaleString()} - Deductions ₹{Number(payslip.totalDeductions).toLocaleString()}
              </div>
            </div>

            <div style={{ fontSize: 26, fontWeight: 800, color: "#ffffff" }}>
              ₹{Number(payslip.net).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExplainablePayslipModal;
