// frontend/src/pages/admin/AdminMachines.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../../firebaseClient";

// Modular Components
import FilterBar from "../../components/AdminMachines/FilterBar";
import Pagination from "../../components/AdminMachines/Pagination";
import MachineTable from "../../components/AdminMachines/MachineTable";

import AddMachineModal from "../../components/AddMachineModal";
import EditMachineModal from "../../components/EditMachineModal";

export default function AdminMachines() {
  const [machines, setMachines] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editMachine, setEditMachine] = useState(null);

  // Filters / Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 🔥 Live Firestore Data
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "machines"), (snap) => {
      setMachines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  // 🔍 FILTERED LIST
  const filteredMachines = useMemo(() => {
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

  // 📄 PAGED LIST
  const pagedMachines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMachines.slice(start, start + pageSize);
  }, [filteredMachines, currentPage, pageSize]);

  // 🔧 UPDATE STATUS
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

    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  }

  // ❌ DELETE MACHINE
  async function deleteMachine(machineId) {
    if (!confirm(`Delete machine ${machineId}?`)) return;

    try {
      await deleteDoc(doc(db, "machines", machineId));

      const user = JSON.parse(localStorage.getItem("sm_user") || "{}");

      await addDoc(collection(db, "admin_actions"), {
        actorEmail: user.email,
        actionType: "delete_machine",
        machineId,
        createdAt: serverTimestamp(),
      });

      alert("Machine deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete machine.");
    }
  }

  return (
    <div>
      {/* HEADER BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Manage Machines</h1>

        <div style={{ display: "flex", gap: 10 }}>
          {/* → Go to Products */}
          <button
            onClick={() => (window.location.href = "/admin/products")}
            style={{
              padding: "8px 14px",
              background: "#9b59b6",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📦 Manage Products
          </button>

          {/* → Add Machine */}
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: "8px 14px",
              background: "#28a745",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
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

      {/* MACHINE TABLE */}
      <MachineTable
        machines={pagedMachines}
        updateStatus={updateStatus}
        setEditMachine={setEditMachine}
        deleteMachine={deleteMachine}
      />

      {/* PAGINATION */}
      <Pagination
        total={filteredMachines.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* ADD MODAL */}
      {showAdd && <AddMachineModal onClose={() => setShowAdd(false)} />}

      {/* EDIT MODAL */}
      {editMachine && (
        <EditMachineModal
          machine={editMachine}
          onClose={() => setEditMachine(null)}
        />
      )}
    </div>
  );
}
