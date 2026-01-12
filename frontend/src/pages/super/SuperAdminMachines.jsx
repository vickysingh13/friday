import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseClient";
import { useAdmin } from "../../contexts/AdminContext";

export default function SuperAdminMachines() {
  console.log("🔥 SuperAdminMachines MOUNTED");

  const navigate = useNavigate();
  const { user } = useAdmin();

  const [machines, setMachines] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [machineSnap, orgSnap] = await Promise.all([
      getDocs(collection(db, "machines")),
      getDocs(collection(db, "organisations")),
    ]);

    setMachines(machineSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setOrgs(orgSnap.docs.map((d) => d.data()));
    setLoading(false);
  }

  /* ───────── ASSIGN / REASSIGN ───────── */
  async function assignMachine(machine, newOrgId) {
    if (!newOrgId) return;

    const isReassign = !!machine.orgId;
    setBusyId(machine.id);

    try {
      await updateDoc(doc(db, "machines", machine.id), {
        orgId: newOrgId,
        assigned: true,
        status: "active",
        disabledReason: null,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_actions"), {
        action: isReassign ? "MACHINE_REASSIGNED" : "MACHINE_ASSIGNED",
        machineId: machine.id,
        fromOrg: machine.orgId || null,
        toOrg: newOrgId,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      await loadData();
    } catch (err) {
      console.error("❌ Machine assign/reassign failed", err);
      alert("Failed to assign machine.");
    } finally {
      setBusyId(null);
    }
  }

  /* ───────── UNASSIGN ───────── */
  async function unassignMachine(machine) {
    if (!window.confirm("Unassign this machine?")) return;

    setBusyId(machine.id);

    try {
      await updateDoc(doc(db, "machines", machine.id), {
        orgId: null,
        assigned: false,
        status: "unassigned",
        disabledReason: null,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_actions"), {
        action: "MACHINE_UNASSIGNED",
        machineId: machine.id,
        fromOrg: machine.orgId,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      await loadData();
    } catch (err) {
      console.error("❌ Unassign failed", err);
      alert("Failed to unassign machine.");
    } finally {
      setBusyId(null);
    }
  }

  /* ───────── SOFT DELETE ───────── */
  async function softDeleteMachine(machine) {
    if (!window.confirm(`Soft delete machine ${machine.id}?`)) return;

    setBusyId(machine.id);

    try {
      await updateDoc(doc(db, "machines", machine.id), {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: user?.email || "unknown",
        status: "deleted",
        assigned: false,
        orgId: null,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_actions"), {
        action: "MACHINE_SOFT_DELETED",
        machineId: machine.id,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      await loadData();
    } catch (err) {
      console.error("❌ Machine soft delete failed", err);
      alert("Soft delete failed");
    } finally {
      setBusyId(null);
    }
  }

  /* ───────── RESTORE (NEW) ───────── */
  async function restoreMachine(machine) {
    if (!window.confirm(`Restore machine ${machine.id}?`)) return;

    setBusyId(machine.id);

    try {
      await updateDoc(doc(db, "machines", machine.id), {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        status: "unassigned",
        assigned: false,
        orgId: null,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_actions"), {
        action: "MACHINE_RESTORED",
        machineId: machine.id,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      await loadData();
    } catch (err) {
      console.error("❌ Machine restore failed", err);
      alert("Restore failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading machines…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={header}>
        <h1>Machines</h1>
        <button
          onClick={() => navigate("/super/machines/create")}
          style={createBtn}
        >
          + Create Machine
        </button>
      </div>

      {/* TABLE */}
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Status</th>
            <th style={th}>Organisation</th>
            <th style={th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {machines.map((m) => (
            <tr key={m.id} style={tr}>
              <td style={td}>{m.id}</td>
              <td style={td}>{m.name || "—"}</td>

              <td style={td}>
                <b>{m.status}</b>
                {m.disabledReason && (
                  <div style={{ fontSize: 12, color: "#c62828" }}>
                    {m.disabledReason}
                  </div>
                )}
              </td>

              <td style={{ ...td, fontFamily: "monospace" }}>
                {m.orgId || "UNASSIGNED"}
              </td>

              {/* 🔹 UPDATED ACTION COLUMN */}
              <td style={td}>
                {m.deleted ? (
                  /* 🔹 Restore Button for deleted machines */
                  <button
                    disabled={busyId === m.id}
                    onClick={() => restoreMachine(m)}
                    style={{ ...btnPrimary, background: "#2e7d32" }}
                  >
                    Restore
                  </button>
                ) : m.orgId ? (
                  /* Assigned State: Show Reassign + Unassign */
                  <>
                    <select
                      disabled={busyId === m.id}
                      onChange={(e) => assignMachine(m, e.target.value)}
                      defaultValue=""
                      style={{ marginRight: 8 }}
                    >
                      <option value="">Reassign</option>
                      {orgs
                        .filter((o) => o.id !== m.orgId)
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                    </select>

                    <button
                      disabled={busyId === m.id}
                      onClick={() => unassignMachine(m)}
                      style={btnDanger}
                    >
                      Unassign
                    </button>
                  </>
                ) : (
                  /* Unassigned State: Show Assign + Soft Delete */
                  <>
                    <select
                      disabled={busyId === m.id}
                      onChange={(e) => assignMachine(m, e.target.value)}
                      defaultValue=""
                    >
                      <option value="">Assign to org</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>

                    <button
                      disabled={busyId === m.id}
                      onClick={() => softDeleteMachine(m)}
                      style={{ ...btnDanger, marginLeft: 8 }}
                    >
                      Soft Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}

          {machines.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 20, color: "#777" }}>
                No machines found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ───────── STYLES ───────── */

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "2px solid #ddd",
  fontWeight: 600,
};

const td = {
  padding: "10px 8px",
  verticalAlign: "middle",
};

const tr = {
  borderBottom: "1px solid #eee",
};

const createBtn = {
  padding: "6px 10px",
  fontSize: 13,
  background: "#1e88e5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 500,
  cursor: "pointer",
};

const btnDanger = {
  padding: "6px 12px",
  background: "#e53935",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const btnPrimary = {
  padding: "6px 12px",
  background: "#1e88e5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};