// frontend/src/components/AdminMachines/MachineTable.jsx
import React from "react";

export default function MachineTable({
  machines,
  updateStatus,
  setEditMachine,
  deleteMachine
}) {
  function formatDate(ts) {
    if (!ts || !ts.seconds) return "-";
    return new Date(ts.seconds * 1000).toLocaleString("en-IN");
  }

  return (
    <table
      style={{
        width: "100%",
        marginTop: 10,
        borderCollapse: "collapse",
        background: "#fff",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <thead style={{ background: "#f1f1f1" }}>
        <tr>
          <th style={th}>ID</th>
          <th style={th}>Name</th>
          <th style={th}>Location</th>
          <th style={th}>Capacity</th>
          <th style={th}>Status</th>
          <th style={th}>Last Refill</th>
          <th style={th}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {machines.map((m) => (
          <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={td}>{m.id}</td>
            <td style={td}>{m.name || "-"}</td>
            <td style={td}>{m.location || "-"}</td>
            <td style={td}>{m.capacity || "-"}</td>

            {/* STATUS DROPDOWN */}
            <td style={td}>
              <select
                value={m.status}
                onChange={(e) => updateStatus(m.id, e.target.value)}
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="service-down">Service Down</option>
              </select>
            </td>

            <td style={td}>{formatDate(m.last_refill_at)}</td>

            {/* ACTION BUTTONS */}
            <td style={td}>
              <button
                style={btnSecondary}
                onClick={() => setEditMachine(m)}
              >
                Edit
              </button>

              <button
                style={btnDanger}
                onClick={() => deleteMachine(m.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* STYLES */
const th = {
  textAlign: "left",
  padding: "10px",
  fontWeight: 700,
  color: "#444",
  fontSize: 14,
};

const td = {
  padding: "10px",
  fontSize: 14,
};

const btnSecondary = {
  padding: "6px 10px",
  marginRight: 10,
  background: "#3498db",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};

const btnDanger = {
  padding: "6px 10px",
  background: "#e74c3c",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};
