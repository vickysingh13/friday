import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebaseClient";

function SuperAdminAuditLogs() {
  console.log("🔥 SuperAdminAuditLogs MOUNTED");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Filters
  const [selectedDate, setSelectedDate] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs(filters = {}) {
    setLoading(true);

    try {
      let q = collection(db, "admin_actions");
      const constraints = [];

      // 🔹 Day-wise filter
      if (filters.date) {
        const date = new Date(filters.date);
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));

        constraints.push(
          where("createdAt", ">=", Timestamp.fromDate(start)),
          where("createdAt", "<=", Timestamp.fromDate(end))
        );
      }

      // 🔹 Action filter (prefix based)
      if (filters.action) {
        constraints.push(where("action", ">=", filters.action));
        constraints.push(where("action", "<=", filters.action + "\uf8ff"));
      }

      const finalQuery = query(
        q,
        ...constraints,
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(finalQuery);

      setLogs(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }))
      );
    } catch (err) {
      console.error("❌ Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    loadLogs({
      date: selectedDate,
      action: actionFilter,
    });
  }

  function resetFilters() {
    setSelectedDate("");
    setActionFilter("");
    loadLogs();
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading audit logs…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Audit Logs</h1>

      {/* 🔹 FILTER BAR */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="ADMIN">Admin</option>
          <option value="MACHINE">Machine</option>
          <option value="ORG">Organisation</option>
        </select>

        <button onClick={applyFilters} style={primaryBtn}>
          Apply
        </button>

        <button onClick={resetFilters} style={secondaryBtn}>
          Reset
        </button>
      </div>

      {/* 🔹 TABLE */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th>Action</th>
            <th>Org</th>
            <th>Machine</th>
            <th>Performed By</th>
            <th>Timestamp</th>
          </tr>
        </thead>

        <tbody>
          {logs.map(log => (
            <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
              <td><b>{log.action}</b></td>
              <td style={{ fontFamily: "monospace" }}>{log.orgId || "—"}</td>
              <td style={{ fontFamily: "monospace" }}>{log.machineId || "—"}</td>
              <td>{log.performedBy || "—"}</td>
              <td>
                {log.createdAt?.toDate
                  ? log.createdAt.toDate().toLocaleString()
                  : "—"}
              </td>
            </tr>
          ))}

          {logs.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 20, color: "#777" }}>
                No audit logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ───────── STYLES ───────── */

const primaryBtn = {
  padding: "6px 12px",
  background: "#1e88e5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "6px 12px",
  background: "#eee",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};

export default SuperAdminAuditLogs;
