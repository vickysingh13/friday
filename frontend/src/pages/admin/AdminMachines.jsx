// frontend/src/pages/admin/AdminMachines.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from "firebase/firestore";

import { db } from "../../firebaseClient";

// Modular Components (assume your FilterBar, Pagination, Add/Edit modals exist)
import FilterBar from "../../components/AdminMachines/FilterBar";
import Pagination from "../../components/AdminMachines/Pagination";
import MachineTable from "../../components/AdminMachines/MachineTable";

import AddMachineModal from "../../components/AddMachineModal";
import EditMachineModal from "../../components/EditMachineModal";

export default function AdminMachines() {
  const [machines, setMachines] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editMachine, setEditMachine] = useState(null);

  const [refillers, setRefillers] = useState([]);

  // Filters / Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load machines live
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "machines"), (snap) => {
      setMachines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  // load refillers for reassign UI
  useEffect(() => {
    async function loadRefillers() {
      try {
        const q = query(collection(db, "users"), where("role", "==", "refiller"));
        const s = await getDocs(q);
        setRefillers(s.docs.map(d => ({ uid: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to load refillers", e);
      }
    }
    loadRefillers();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  // FILTERED LIST
  const filtered = useMemo(() => {
    const txt = search.toLowerCase();

    return machines.filter((m) => {
      const matchesSearch =
        m.id.toLowerCase().includes(txt) ||
        (m.name || "").toLowerCase().includes(txt) ||
        (m.location || "").toLowerCase().includes(txt);

      const matchesStatus =
        statusFilter === "all" || m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [machines, search, statusFilter]);

  // PAGED LIST
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // UPDATE STATUS
  async function updateStatus(machineId, newStatus) {
    try {
      await updateDoc(doc(db, "machines", machineId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      const user = JSON.parse(localStorage.getItem("sm_user") || "{}");

      await addDoc(collection(db, "admin_actions"), {
        actorEmail: user.email,
        actionType: "change_status",
        machineId,
        newStatus,
        createdAt: serverTimestamp()
      });

    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  }

  // DELETE MACHINE
  async function deleteMachine(machineId) {
    if (!confirm(`Delete machine ${machineId}?`)) return;

    try {
      await deleteDoc(doc(db, "machines", machineId));

      const user = JSON.parse(localStorage.getItem("sm_user") || "{}");

      await addDoc(collection(db, "admin_actions"), {
        actorEmail: user.email,
        actionType: "delete_machine",
        machineId,
        createdAt: serverTimestamp()
      });

      alert("Machine deleted.");
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  }

  // UNASSIGN machine (remove assignedTo and assignedEmail)
  async function unassignMachine(machineId) {
    if (!confirm(`Unassign machine ${machineId} from user?`)) return;
    try {
      await updateDoc(doc(db, "machines", machineId), {
        assignedTo: null,
        assignedEmail: null,
        assignedAt: serverTimestamp()
      });

      const user = JSON.parse(localStorage.getItem("sm_user") || "{}");
      await addDoc(collection(db, "admin_actions"), {
        actorEmail: user.email || null,
        actionType: "unassign_machine",
        machineId,
        createdAt: serverTimestamp()
      });

      alert("Machine unassigned.");
    } catch (e) {
      console.error(e);
      alert("Failed to unassign.");
    }
  }

  // REASSIGN inline
  async function reassignMachine(machineId, refillerUid) {
    if (!refillerUid) {
      alert("Choose a refiller.");
      return;
    }
    try {
      const ref = refillers.find(r => r.uid === refillerUid);
      await updateDoc(doc(db, "machines", machineId), {
        assignedTo: refillerUid,
        assignedEmail: ref?.email || null,
        assignedAt: serverTimestamp()
      });

      const user = JSON.parse(localStorage.getItem("sm_user") || "{}");
      await addDoc(collection(db, "admin_actions"), {
        actorEmail: user.email || null,
        actionType: "reassign_machine",
        machineId,
        assignedTo: refillerUid,
        assignedEmail: ref?.email || null,
        createdAt: serverTimestamp()
      });

      alert("Reassigned.");
    } catch (e) {
      console.error(e);
      alert("Reassign failed.");
    }
  }

  return (
    <div>
      {/* HEADER BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Manage Machines</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => (window.location.href = "/admin/machines/assign")} style={{
            padding: "8px 14px",
            background: "#9b59b6",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}>Assign Machines</button>

          <button onClick={() => setShowAdd(true)} style={{
            padding: "8px 14px",
            background: "#28a745",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}>
            + Add Machine
          </button>
        </div>
      </div>

      <p>Live view — updates instantly when machines change</p>

      {/* FILTER BAR */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* MACHINE TABLE (custom rendering) */}
      <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse", background: "#fff", borderRadius: 8 }}>
        <thead style={{ background: "#f1f1f1" }}>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Location</th>
            <th style={th}>Capacity</th>
            <th style={th}>Status</th>
            <th style={th}>Assigned To</th>
            <th style={th}>Last Refill</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paged.map(m => (
            <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{m.id}</td>
              <td style={td}>{m.name || "-"}</td>
              <td style={td}>{m.location || "-"}</td>
              <td style={td}>{m.capacity || "-"}</td>
              <td style={td}>
                <select value={m.status || "active"} onChange={(e) => updateStatus(m.id, e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="service-down">Service Down</option>
                </select>
              </td>

              <td style={td}>
                {m.assignedEmail ? (
                  <>
                    <div style={{ marginBottom: 6 }}>{m.assignedEmail}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => unassignMachine(m.id)} style={btnDanger}>Unassign</button>

                      <select id={`reassign-${m.id}`} style={{ padding: 6, borderRadius: 6 }}>
                        <option value="">-- reassign --</option>
                        {refillers.map(r => (
                          <option key={r.uid} value={r.uid}>{r.displayName || r.email || r.uid}</option>
                        ))}
                      </select>
                      <button onClick={() => {
                        const sel = document.getElementById(`reassign-${m.id}`);
                        reassignMachine(m.id, sel ? sel.value : "");
                      }} style={btnPrimary}>Reassign</button>
                    </div>
                  </>
                ) : (
                  <em style={{ color: "#888" }}>Unassigned</em>
                )}
              </td>

              <td style={td}>{(m.last_refill_at && m.last_refill_at.seconds) ? new Date(m.last_refill_at.seconds * 1000).toLocaleString("en-IN") : "-"}</td>

              <td style={td}>
                <button style={btnSecondary} onClick={() => setEditMachine(m)}>Edit</button>
                <button style={btnDanger} onClick={() => deleteMachine(m.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <Pagination
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* ADD / EDIT MODALS */}
      {showAdd && <AddMachineModal onClose={() => setShowAdd(false)} />}
      {editMachine && <EditMachineModal machine={editMachine} onClose={() => setEditMachine(null)} />}
    </div>
  );
}

/* styles */
const th = { textAlign: "left", padding: "10px", fontWeight: 700, color: "#444", fontSize: 14 };
const td = { padding: "10px", fontSize: 14 };

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

const btnPrimary = {
  padding: "6px 10px",
  background: "#28a745",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};
