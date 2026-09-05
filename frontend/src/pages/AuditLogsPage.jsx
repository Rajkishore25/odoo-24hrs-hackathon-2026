import React, { useState, useEffect } from "react";
import { auditApi } from "../api/auditApi.js";
import { ShieldCheck, ChevronDown, ChevronRight, Clock, FileText, Filter } from "lucide-react";

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditApi.getLogs({ action: actionFilter || undefined });
      setLogs(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action) => {
    if (action.includes("FINALIZED")) return "badge-success";
    if (action.includes("DELETED") || action.includes("REJECTED")) return "badge-danger";
    if (action.includes("UPDATED") || action.includes("EXCEPTION")) return "badge-warning";
    return "badge-info";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Immutable Audit Trail</h2>
            <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={12} />
              <span>Tamper-Evident</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            System-wide change log tracking contract changes, salary rule updates, and payroll finalizations.
          </p>
        </div>

        {/* Action Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={14} color="var(--text-muted)" />
          <select
            className="form-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ width: 220, fontSize: 12, padding: "6px 12px" }}
          >
            <option value="">All Audit Actions</option>
            <option value="PAYRUN_FINALIZED">PAYRUN_FINALIZED</option>
            <option value="PAYRUN_COMPUTED">PAYRUN_COMPUTED</option>
            <option value="PAYRUN_CREATED">PAYRUN_CREATED</option>
            <option value="CONTRACT_CREATED">CONTRACT_CREATED</option>
            <option value="SALARY_STRUCTURE_CREATED">SALARY_STRUCTURE_CREATED</option>
            <option value="TIME_OFF_REQUEST_APPROVED">TIME_OFF_REQUEST_APPROVED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Actor (User)</th>
              <th>Entity</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => {
                const isExpanded = expandedRow === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                    >
                      <td>{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={12} />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadge(log.action)}`} style={{ fontSize: 10 }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <strong>{log.user?.email?.split("@")[0] || "System"}</strong>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{log.user?.role || "SYSTEM"}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{log.entityType}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {log.entityId ? log.entityId.slice(0, 8) + "..." : "—"}
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                        {log.reason || "Operational record mutation"}
                      </td>
                    </tr>

                    {/* Expandable Old vs New Diff Inspector */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ background: "rgba(15, 23, 42, 0.95)", padding: "16px 24px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase", marginBottom: 6 }}>
                                Pre-Mutation State (Old Value)
                              </div>
                              <pre
                                style={{
                                  background: "rgba(0, 0, 0, 0.4)",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: 12,
                                  fontSize: 11.5,
                                  fontFamily: "var(--font-mono)",
                                  color: "#cbd5e1",
                                  overflowX: "auto",
                                  maxHeight: 180,
                                }}
                              >
                                {log.oldData ? JSON.stringify(log.oldData, null, 2) : "null (New Record Initialized)"}
                              </pre>
                            </div>

                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", textTransform: "uppercase", marginBottom: 6 }}>
                                Post-Mutation State (New Value)
                              </div>
                              <pre
                                style={{
                                  background: "rgba(0, 0, 0, 0.4)",
                                  border: "1px solid rgba(16, 185, 129, 0.2)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: 12,
                                  fontSize: 11.5,
                                  fontFamily: "var(--font-mono)",
                                  color: "#a7f3d0",
                                  overflowX: "auto",
                                  maxHeight: 180,
                                }}
                              >
                                {log.newData ? JSON.stringify(log.newData, null, 2) : "null (Record Deactivated)"}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                  No audit logs found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogsPage;
