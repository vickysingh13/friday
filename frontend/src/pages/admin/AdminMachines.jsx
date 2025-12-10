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
  where,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseClient";

import FilterBar from "../../components/AdminMachines/FilterBar";
import Pagination from "../../components/AdminMachines/Pagination";
import AddMachineModal from "../../components/AddMachineModal";
import EditMachineModal from "../../components/EditMachineModal";

export default function AdminMachines() {
  const nav = useNavigate();

  const [machines, setMachines] = useState([]);
  const [refillers, setRefillers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editMachine, setEditMachine] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /** LOAD MACHINES LIVE */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "machines"), (snap) => {
      setMachines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  /** LOAD REFILLERS */
  useEffect(() => {
    async function loadRefillers() {
      try {
        const q = query(collection(db, "users"), where("role", "==", "refiller"));
        const s = await getDocs(q);
        setRefillers(s.docs.map((d) => ({ uid: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to load refillers", e);
      }
    }
    loadRefillers();
  }, []);

  useEffect(() => setCurrentPage(1), [search, statusFilter, pageSize]);

  /** FILTER MACHINES */
  const filtered = useMemo(() => {
    const txt = search.toLowerCase();
    return machines.filter((m) => {
      const matchesSearch =
        m.id.toLowerCase().includes(txt) ||
        (m.name || "").toLowerCase().includes(txt) ||
        (m.location || "").toLowerCase().includes(txt);

      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [machines, search, statusFilter]);

  /** PAGINATE */
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  /** UPDATE STATUS */
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
        createdAt: serverTimestamp(),
      });
    } catch {
      alert("Failed to update status.");
    }
  }

  /** DELETE MACHINE */
  async function deleteMachine(machineId) {
    if (!confirm(`Delete machine ${machineId}?`)) return;
    try {
      await deleteDoc(doc(db, "machines", machineId));
      alert("Machine deleted.");
    } catch {
      alert("Delete failed.");
    }
  }

  /** UNASSIGN MACHINE */
  async function unassignMachine(machineId) {
    if (!confirm(`Unassign machine ${machineId}?`)) return;
    await updateDoc(doc(db, "machines", machineId), {
      assignedTo: null,
      assignedEmail: null,
      assignedAt: serverTimestamp(),
    });
  }

  /** REASSIGN */
  async function reassignMachine(machineId, refillerUid) {
    if (!refillerUid) return alert("Choose a refiller.");
    const ref = refillers.find((r) => r.uid === refillerUid);
    await updateDoc(doc(db, "machines", machineId), {
      assignedTo: refillerUid,
      assignedEmail: ref?.email,
      assignedAt: serverTimestamp(),
    });
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Manage Machines</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={btnPurple} onClick={() => nav("/admin/machines/assign")}>
            Assign Machines
          </button>

          <button style={btnGreen} onClick={() => setShowAdd(true)}>
            + Add Machine
          </button>
        </div>
      </div>

      <FilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* MACHINES TABLE */}
      <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
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
          {paged.map((m) => (
            <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{m.id}</td>
              <td style={td}>{m.name || "-"}</td>
              <td style={td}>{m.location || "-"}</td>
              <td style={td}>{m.capacity || "-"}</td>

              <td style={td}>
                <select
                  value={m.status || "active"}
                  onChange={(e) => updateStatus(m.id, e.target.value)}
                  style={{ padding: 6, borderRadius: 6 }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="service-down">Service Down</option>
                </select>
              </td>

              <td style={td}>{m.assignedEmail || <em>Unassigned</em>}</td>

              <td style={td}>
                {m.last_refill_at?.seconds
                  ? new Date(m.last_refill_at.seconds * 1000).toLocaleString("en-IN")
                  : "-"}
              </td>

              <td style={td}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button style={btnSecondary} onClick={() => setEditMachine(m)}>
                    Edit
                  </button>

                  {/* OPEN SLOT CONFIG PAGE */}
                  <button
                    style={btnPurple}
                    onClick={() => nav(`/admin/machines/${m.id}/slots`)}
                  >
                    Configure Slots
                  </button>

                  <button style={btnDanger} onClick={() => deleteMachine(m.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {showAdd && <AddMachineModal onClose={() => setShowAdd(false)} />}
      {editMachine && <EditMachineModal machine={editMachine} onClose={() => setEditMachine(null)} />}
    </div>
  );
}

/* styles */
const th = { textAlign: "left", padding: "10px", fontWeight: 700, fontSize: 14 };
const td = { padding: "10px", fontSize: 14 };

const btnSecondary = { padding: "6px 10px", background: "#3498db", borderRadius: 6, color: "#fff" };
const btnDanger = { padding: "6px 10px", background: "#e74c3c", borderRadius: 6, color: "#fff" };
const btnGreen = { padding: "8px 14px", background: "#28a745", borderRadius: 6, color: "#fff" };
const btnPurple = { padding: "6px 10px", background: "#6f42c1", borderRadius: 6, color: "#fff" };
