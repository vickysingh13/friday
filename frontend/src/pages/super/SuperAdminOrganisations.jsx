import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebaseClient";
import { useAdmin } from "../../contexts/AdminContext";
import { useNavigate } from "react-router-dom";

export default function SuperAdminOrganisations() {
  console.log("🔥 SuperAdminOrganisations MOUNTED");

  const { user } = useAdmin();
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyOrg, setBusyOrg] = useState(null);

  // Toggle state: false = show active, true = show deleted
  const [showDeleted, setShowDeleted] = useState(false);

  // Re-run when toggle changes
  useEffect(() => {
    loadOrgs();
  }, [showDeleted]);

  async function loadOrgs() {
    setLoading(true);

    try {
      if (showDeleted) {
        // 🔹 CASE 1: Show DELETED organisations
        // We can use a query here because we know 'deleted' exists and is true
        const q = query(
          collection(db, "organisations"), 
          where("deleted", "==", true)
        );
        const snap = await getDocs(q);
        setOrgs(snap.docs.map((d) => d.data()));
      } else {
        // 🔹 CASE 2: Show ACTIVE organisations
        // PROBLEM: `where("deleted", "!=", true)` hides docs where 'deleted' field is missing.
        // FIX: Fetch ALL, then filter in JS to include those with missing 'deleted' field.
        const snap = await getDocs(collection(db, "organisations"));
        const allOrgs = snap.docs.map((d) => d.data());
        
        // Filter out any that are explicitly deleted
        const activeOrgs = allOrgs.filter(org => org.deleted !== true);
        setOrgs(activeOrgs);
      }
    } catch (error) {
      console.error("Error loading organisations:", error);
    } finally {
      setLoading(false);
    }
  }

  /* ───────── ACTIONS ───────── */

  async function suspendOrg(org) {
    if (!window.confirm(`Suspend ${org.name}? Machines will be unassigned.`)) {
      return;
    }

    setBusyOrg(org.id);
    const batch = writeBatch(db);

    batch.update(doc(db, "organisations", org.id), {
      status: "suspended",
      suspended: true,
      suspendedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const machinesSnap = await getDocs(
      query(collection(db, "machines"), where("orgId", "==", org.id))
    );

    machinesSnap.forEach((machine) => {
      batch.update(machine.ref, {
        orgId: null,
        assigned: false,
        assignedTo: null,
        status: "disabled",
        disabledReason: "ORG_SUSPENDED",
        updatedAt: serverTimestamp(),
      });
    });

    await addDoc(collection(db, "admin_actions"), {
      action: "ORG_SUSPENDED",
      orgId: org.id,
      orgName: org.name,
      affectedMachines: machinesSnap.size,
      performedBy: user.email,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    await loadOrgs();
    setBusyOrg(null);
  }

  async function activateOrg(org) {
    setBusyOrg(org.id);

    await updateDoc(doc(db, "organisations", org.id), {
      status: "active",
      suspended: false,
      suspendedAt: null,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "admin_actions"), {
      action: "ORG_ACTIVATED",
      orgId: org.id,
      orgName: org.name,
      performedBy: user.email,
      createdAt: serverTimestamp(),
    });

    await loadOrgs();
    setBusyOrg(null);
  }

  // 🔹 Soft Delete Function
  async function softDeleteOrg(org) {
    if (!window.confirm(`Soft delete organisation ${org.name}?`)) return;

    setBusyOrg(org.id);

    try {
      await updateDoc(doc(db, "organisations", org.id), {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: user?.email || "unknown",
        status: "deleted",
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_actions"), {
        action: "ORG_SOFT_DELETED",
        orgId: org.id,
        orgName: org.name,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      await loadOrgs();
    } catch (err) {
      console.error("❌ Org soft delete failed", err);
      alert("Soft delete failed");
    } finally {
      setBusyOrg(null);
    }
  }

  // 🔹 Restore Function
  async function restoreOrg(org) {
    if (!window.confirm(`Restore organisation ${org.name}?`)) return;

    setBusyOrg(org.id);

    try {
      await updateDoc(doc(db, "organisations", org.id), {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        status: "active",
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_actions"), {
        action: "ORG_RESTORED",
        orgId: org.id,
        orgName: org.name,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      await loadOrgs();
    } catch (err) {
      console.error("❌ Org restore failed", err);
      alert("Restore failed");
    } finally {
      setBusyOrg(null);
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading organisations…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={header}>
        <h1>Organisations</h1>

        <button
          onClick={() => navigate("/super/orgs/create")}
          style={createBtn}
        >
          + Create Organisation
        </button>
      </div>

      {/* 🔹 Toggle UI */}
      <label style={{ marginBottom: 16, display: "flex", alignItems: "center", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={showDeleted}
          onChange={() => setShowDeleted((v) => !v)}
          style={{ marginRight: 8, transform: "scale(1.2)" }}
        />
        <span style={{ fontWeight: 500 }}>
          {showDeleted ? "Showing Deleted Organisations Only" : "Show Deleted Organisations"}
        </span>
      </label>

      {/* TABLE */}
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Org ID</th>
            <th style={th}>Status</th>
            <th style={th}>Admin</th>
            <th style={th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {orgs.map((org) => (
            <tr key={org.id} style={tr}>
              <td style={td}>{org.name}</td>
              <td style={{ ...td, fontFamily: "monospace" }}>{org.id}</td>
              <td style={td}>{org.status.toUpperCase()}</td>
              <td style={td}>{org.adminEmail}</td>

              {/* Action Column */}
              <td style={td}>
                {!org.deleted ? (
                  <>
                    {/* Preserve existing Suspend/Activate toggle */}
                    {org.status === "active" ? (
                      <button
                        disabled={busyOrg === org.id}
                        onClick={() => suspendOrg(org)}
                        style={dangerBtn}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        disabled={busyOrg === org.id}
                        onClick={() => activateOrg(org)}
                        style={primaryBtn}
                      >
                        Activate
                      </button>
                    )}

                    {/* Soft Delete Button */}
                    <button
                      disabled={busyOrg === org.id}
                      onClick={() => softDeleteOrg(org)}
                      style={{ ...dangerBtn, marginLeft: 8, background: "#6d4c41" }}
                    >
                      Soft Delete
                    </button>
                  </>
                ) : (
                  /* Restore Button for deleted orgs */
                  <button
                    disabled={busyOrg === org.id}
                    onClick={() => restoreOrg(org)}
                    style={{ ...primaryBtn, background: "#2e7d32" }}
                  >
                    Restore
                  </button>
                )}
              </td>
            </tr>
          ))}

          {orgs.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#666" }}>
                {showDeleted 
                  ? "No deleted organisations found." 
                  : "No active organisations found."}
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

const dangerBtn = {
  padding: "6px 12px",
  background: "#e53935",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const primaryBtn = {
  padding: "6px 12px",
  background: "#1e88e5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};