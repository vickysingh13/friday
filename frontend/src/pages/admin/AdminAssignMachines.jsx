// frontend/src/pages/admin/AdminAssignMachines.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseClient";

export default function AdminAssignMachines() {
  const [refillers, setRefillers] = useState([]);
  const [machines, setMachines] = useState([]);

  const [selectedRefiller, setSelectedRefiller] = useState("");
  const [assigning, setAssigning] = useState(false);

  // LIVE: load all refillers (users with role = refiller)
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "refiller"));

    const unsub = onSnapshot(q, (snap) => {
      setRefillers(
        snap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  // LIVE: load all machines
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "machines"), (snap) => {
      setMachines(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  // FILTER UNASSIGNED MACHINES
  const unassignedMachines = machines.filter((m) => !m.assignedTo);

  // ASSIGN MACHINE
  async function assignMachine(machineId) {
    if (!selectedRefiller) {
      alert("Select a refiller first.");
      return;
    }

    try {
      setAssigning(true);

      await updateDoc(doc(db, "machines", machineId), {
        assignedTo: selectedRefiller,
      });

      alert("Machine assigned successfully!");

    } catch (err) {
      console.error(err);
      alert("Failed to assign machine.");
    } finally {
      setAssigning(false);
    }
  }

  // REMOVE ASSIGNMENT
  async function unassignMachine(machineId) {
    try {
      await updateDoc(doc(db, "machines", machineId), {
        assignedTo: "",
      });

      alert("Machine unassigned.");
    } catch (err) {
      console.error(err);
      alert("Failed to unassign.");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Assign Machines to Refillers</h1>

      {/* SELECT REFILLER */}
      <div style={{ marginTop: 20 }}>
        <label style={{ fontWeight: 600 }}>Select Refiller:</label>
        <select
          value={selectedRefiller}
          onChange={(e) => setSelectedRefiller(e.target.value)}
          style={{
            marginLeft: 10,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #aaa",
          }}
        >
          <option value="">-- choose refiller --</option>
          {refillers.map((r) => (
            <option key={r.uid} value={r.uid}>
              {r.displayName || r.email}
            </option>
          ))}
        </select>
      </div>

      {/* UNASSIGNED MACHINES TABLE */}
      <h2 style={{ marginTop: 30 }}>Unassigned Machines</h2>

      {unassignedMachines.length === 0 && (
        <p>No unassigned machines found.</p>
      )}

      {unassignedMachines.length > 0 && (
        <table
          style={{
            width: "100%",
            marginTop: 10,
            borderCollapse: "collapse",
            background: "#fff",
          }}
        >
          <thead style={{ background: "#eee" }}>
            <tr>
              <th style={th}>Machine ID</th>
              <th style={th}>Name</th>
              <th style={th}>Location</th>
              <th style={th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {unassignedMachines.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={td}>{m.id}</td>
                <td style={td}>{m.name}</td>
                <td style={td}>{m.location}</td>

                <td style={td}>
                  <button
                    disabled={assigning}
                    style={assignBtn}
                    onClick={() => assignMachine(m.id)}
                  >
                    Assign →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ALREADY ASSIGNED MACHINES */}
      <h2 style={{ marginTop: 40 }}>Assigned Machines</h2>

      {machines.filter((m) => m.assignedTo).length === 0 && (
        <p>No machines assigned to any refiller.</p>
      )}

      {machines
        .filter((m) => m.assignedTo)
        .map((m) => {
          const assignedUser = refillers.find(r => r.uid === m.assignedTo);

          return (
            <div
              key={m.id}
              style={{
                marginBottom: 12,
                padding: 16,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <b>{m.name}</b> – {m.location}
              <br />
              <small>
                Assigned To: {assignedUser?.displayName || assignedUser?.email}
              </small>

              <button
                style={removeBtn}
                onClick={() => unassignMachine(m.id)}
              >
                Unassign
              </button>
            </div>
          );
        })}
    </div>
  );
}

/* Styles */
const th = {
  textAlign: "left",
  padding: 10,
  fontWeight: 700,
};

const td = {
  padding: 10,
};

const assignBtn = {
  padding: "6px 12px",
  background: "#2ecc71",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const removeBtn = {
  marginLeft: 12,
  padding: "6px 12px",
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
