import React, { useState, useEffect } from "react";
import { leaveApi, employeeApi } from "../api/hrApi.js";
import { Plus, Check, X, CalendarOff } from "lucide-react";

export function LeavePage() {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    timeOffTypeId: "",
    startDate: "2026-09-15",
    endDate: "2026-09-16",
    reason: "Personal leave",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, typesRes, empRes] = await Promise.all([
        leaveApi.getRequests(),
        leaveApi.getTypes(),
        employeeApi.getEmployees(),
      ]);
      setRequests(reqRes.data.items || []);
      const t = typesRes.data || [];
      const e = empRes.data.items || [];
      setTypes(t);
      setEmployees(e);

      if (e.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({ ...prev, employeeId: e[0].id, timeOffTypeId: t[0]?.id || "" }));
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

  const handleApprove = async (id) => {
    try {
      await leaveApi.approveRequest(id);
      alert("✅ Leave request approved!");
      fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason:", "Operational coverage needed");
    if (!reason) return;
    try {
      await leaveApi.rejectRequest(id, reason);
      alert("Leave request rejected.");
      fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leaveApi.createRequest(formData);
      setShowModal(false);
      alert("Leave request submitted successfully!");
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
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Time Off & Leave Requests</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Leave balance calculation, submission, and manager approvals.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          <span>Request Leave</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Requested Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Manager Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.employee?.name}</strong>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.employee?.employeeCode}</div>
                </td>
                <td>{r.timeOffType?.name || "Annual"}</td>
                <td>
                  {r.startDate.slice(0, 10)} to {r.endDate.slice(0, 10)}
                </td>
                <td style={{ fontWeight: 700 }}>{r.requestedDays} days</td>
                <td style={{ color: "var(--text-secondary)", fontSize: 12.5 }}>{r.reason || "—"}</td>
                <td>
                  <span
                    className={`badge ${
                      r.status === "APPROVED"
                        ? "badge-success"
                        : r.status === "REJECTED"
                        ? "badge-danger"
                        : "badge-warning"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.status === "SUBMITTED" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id)}>
                        <Check size={13} />
                        <span>Approve</span>
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.id)}>
                        <X size={13} />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Submit Leave Request</h3>
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
                <label className="form-label">Leave Type</label>
                <select
                  className="form-select"
                  value={formData.timeOffTypeId}
                  onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
                  required
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.isPaid ? "Paid" : "Unpaid"})
                    </option>
                  ))}
                </select>
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
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <input
                  className="form-input"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeavePage;
