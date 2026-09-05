import React, { useState, useEffect } from "react";
import { attendanceApi, employeeApi } from "../api/hrApi.js";
import { Clock, LogIn, LogOut, AlertTriangle, CheckCircle } from "lucide-react";

export function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, empRes] = await Promise.all([
        attendanceApi.getAttendance(),
        employeeApi.getEmployees(),
      ]);
      setRecords(attRes.data.items || []);
      const emps = empRes.data.items || [];
      setEmployees(emps);
      if (emps.length > 0 && !selectedEmp) {
        setSelectedEmp(emps[0].id);
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

  const handleCheckIn = async () => {
    if (!selectedEmp) return;
    try {
      await attendanceApi.checkIn(selectedEmp);
      alert("✅ Checked in successfully!");
      fetchData();
    } catch (err) {
      alert("Check-in error: " + err.message);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmp) return;
    try {
      await attendanceApi.checkOut(selectedEmp);
      alert("✅ Checked out successfully!");
      fetchData();
    } catch (err) {
      alert("Check-out error: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Attendance & Punch Tracking</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Real-time check-in punches, net worked hours, and automated exception detection.
          </p>
        </div>

        {/* Punch Simulation Widget */}
        <div className="glass-panel" style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <select
            className="form-select"
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            style={{ width: 180, fontSize: 12, padding: "6px 10px" }}
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeCode})
              </option>
            ))}
          </select>

          <button className="btn btn-success btn-sm" onClick={handleCheckIn}>
            <LogIn size={13} />
            <span>Punch In</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCheckOut}>
            <LogOut size={13} />
            <span>Punch Out</span>
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Worked Hours</th>
              <th>Status</th>
              <th>Exception Flag</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.date ? r.date.slice(0, 10) : "Today"}</td>
                <td>
                  <strong>{r.employee?.name}</strong>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.employee?.employeeCode}</div>
                </td>
                <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td style={{ fontWeight: 700 }}>{r.workedHours} hrs</td>
                <td>
                  <span className={`badge ${r.status === "PRESENT" ? "badge-success" : "badge-neutral"}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.hasException ? (
                    <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={11} />
                      <span>EXCEPTION</span>
                    </span>
                  ) : (
                    <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={11} />
                      <span>NORMAL</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttendancePage;
