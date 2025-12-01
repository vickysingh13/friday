// frontend/src/pages/admin/AdminAuditLogs.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebaseClient";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);

  const [emailFilter, setEmailFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // LOAD LOGS LIVE
  useEffect(() => {
    const q = query(
      collection(db, "admin_actions"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setLogs(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  // FILTERED LOGS
  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchEmail =
        !emailFilter ||
        (log.actorEmail || "")
          .toLowerCase()
          .includes(emailFilter.toLowerCase());

      const matchAction =
        actionFilter === "all" || log.actionType === actionFilter;

      const matchDate =
        !dateFilter ||
        (log.createdAt &&
          new Date(log.createdAt.seconds * 1000)
            .toISOString()
            .slice(0, 10) === dateFilter);

      return matchEmail && matchAction && matchDate;
    });
  }, [logs, emailFilter, actionFilter, dateFilter]);

  // PAGED
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  function formatDate(ts) {
    if (!ts?.seconds) return "-";
    return new Date(ts.seconds * 1000).toLocaleString("en-IN");
  }

  function exportCSV() {
    const header = "Email,Action,Machine ID,New Status,Date\n";

    const rows = filtered
      .map((log) => {
        return [
          log.actorEmail || "",
          log.actionType,
          log.machineId || "",
          log.newStatus || "",
          formatDate(log.createdAt),
        ].join(",");
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_logs.csv";
    a.click();
  }

  return (
    <div>
      <h1>Audit Logs</h1>

      {/* FILTER BAR */}
      <div style={{ display: "flex", gap: 15, marginTop: 15 }}>
        <input
          type="text"
          placeholder="Filter by email…"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          style={inputStyle}
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All Actions</option>
          <option value="change_status">Status Change</option>
          <option value="delete_machine">Delete Machine</option>
          <option value="edit_machine">Edit Machine</option>
          <option value="add_machine">Add Machine</option>
          <option value="delete_product">Delete Product</option>
          <option value="add_product">Add Product</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={inputStyle}
        />

        <button onClick={exportCSV} style={exportBtn}>
          ⬇ Export CSV
        </button>
      </div>

      {/* TABLE */}
      <table style={table}>
        <thead style={{ background: "#eee" }}>
          <tr>
            <th style={th}>Email</th>
            <th style={th}>Action</th>
            <th style={th}>Machine</th>
            <th style={th}>New Status</th>
            <th style={th}>Date</th>
          </tr>
        </thead>

        <tbody>
          {paged.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={td}>{log.actorEmail || "-"}</td>
              <td style={td}>{log.actionType}</td>
              <td style={td}>{log.machineId || "-"}</td>
              <td style={td}>{log.newStatus || "-"}</td>
              <td style={td}>{formatDate(log.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* STYLES */
const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
};

const exportBtn = {
  padding: "8px 12px",
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const table = {
  width: "100%",
  marginTop: 20,
  borderCollapse: "collapse",
  background: "#fff",
};

const th = {
  padding: 10,
  textAlign: "left",
  fontWeight: 600,
};

const td = {
  padding: 10,
};
