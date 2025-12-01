// frontend/src/pages/admin/AdminRefillLogs.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../../firebaseClient";

export default function AdminRefillLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "refill_logs"), (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  function formatDate(ts) {
    if (!ts || !ts.seconds) return "-";
    return new Date(ts.seconds * 1000).toLocaleString("en-IN");
  }

  function isWithinFilter(log) {
    if (!log.createdAt) return false;

    const logDate = new Date(log.createdAt.seconds * 1000);
    const today = new Date();

    if (filter === "today") {
      return logDate.toDateString() === today.toDateString();
    }

    if (filter === "7d") {
      const diff = today - logDate;
      return diff / (1000 * 60 * 60 * 24) <= 7;
    }

    if (filter === "month") {
      return (
        logDate.getMonth() === today.getMonth() &&
        logDate.getFullYear() === today.getFullYear()
      );
    }

    return true;
  }

  const filtered = useMemo(() => {
    const txt = search.toLowerCase().trim();
    return logs.filter((l) => {
      const matchSearch =
        (l.userEmail || "").toLowerCase().includes(txt) ||
        (l.machineId || "").toLowerCase().includes(txt) ||
        (l.action || "").toLowerCase().includes(txt);

      return matchSearch && isWithinFilter(l);
    });
  }, [logs, search, filter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  async function deleteLog(id) {
    if (!confirm("Delete this log?")) return;
    await deleteDoc(doc(db, "refill_logs", id));
  }

  function exportCSV() {
    const header = "User,Machine,Action,Time\n";
    const rows = filtered
      .map(
        (l) =>
          `${l.userEmail || "-"},${l.machineId || "-"},${l.action || "-"},${formatDate(
            l.createdAt
          )}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "refill_logs.csv";
    link.click();
  }

  return (
    <div>
      <h1>Refill Logs</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: 20, margin: "20px 0" }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by email, machine, action..."
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        >
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="month">This month</option>
        </select>

        <button
          onClick={exportCSV}
          style={{
            background: "#2980b9",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <thead style={{ background: "#f1f1f1" }}>
          <tr>
            <th style={th}>User</th>
            <th style={th}>Machine</th>
            <th style={th}>Action</th>
            <th style={th}>Time</th>
            <th style={th}>Delete</th>
          </tr>
        </thead>

        <tbody>
          {paged.map((l) => (
            <tr key={l.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{l.userEmail || "-"}</td>
              <td style={td}>{l.machineId || "-"}</td>
              <td style={td}>{l.action || "-"}</td>
              <td style={td}>{formatDate(l.createdAt)}</td>

              <td style={td}>
                <button
                  onClick={() => deleteLog(l.id)}
                  style={{
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          Rows:
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{ marginLeft: 10 }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={btnPage(page === 1)}
          >
            Prev
          </button>

          <button
            disabled={page * pageSize >= filtered.length}
            onClick={() => setPage((p) => p + 1)}
            style={btnPage(page * pageSize >= filtered.length)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: 10,
  fontWeight: "bold",
  fontSize: 14,
};

const td = {
  padding: 10,
  fontSize: 14,
};

const btnPage = (disabled) => ({
  padding: "6px 12px",
  background: disabled ? "#bbb" : "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: disabled ? "not-allowed" : "pointer",
});
