import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebaseClient";
import { useAdmin } from "../../contexts/AdminContext";

export default function SuperAdminAdmins() {
  console.log("🔥 SuperAdminAdmins MOUNTED");

  const navigate = useNavigate();
  const { user } = useAdmin();

  const [admins, setAdmins] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterOrg, setFilterOrg] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [adminSnap, orgSnap] = await Promise.all([
      getDocs(query(collection(db, "users"), where("role", "==", "admin"))),
      getDocs(collection(db, "organisations")),
    ]);

    setAdmins(
      adminSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.deleted !== true)
    );

    setOrgs(orgSnap.docs.map(d => d.data()));
    setLoading(false);
  }

  async function log(action, payload = {}) {
    await addDoc(collection(db, "admin_actions"), {
      action,
      performedBy: user?.email || "unknown",
      createdAt: serverTimestamp(),
      ...payload,
    });
  }

  async function resendReset(email) {
    if (!window.confirm(`Send password reset to ${email}?`)) return;

    try {
      await sendPasswordResetEmail(auth, email);
      await log("ADMIN_PASSWORD_RESET_SENT", { adminEmail: email });
      alert("Password reset email sent.");
    } catch (err) {
      console.error("❌ Reset failed", err);
      alert("Failed to send reset email.");
    }
  }

  async function toggleAdmin(admin, enable) {
    setBusyId(admin.id);

    try {
      await updateDoc(doc(db, "users", admin.id), {
        status: enable ? "active" : "disabled",
        updatedAt: serverTimestamp(),
      });

      await log(enable ? "ADMIN_ENABLED" : "ADMIN_DISABLED", {
        adminEmail: admin.email,
        orgId: admin.orgId,
      });

      await loadData();
    } catch (err) {
      console.error("❌ Admin toggle failed", err);
      alert("Failed to update admin status.");
    } finally {
      setBusyId(null);
    }
  }

  async function reassignAdmin(admin, newOrgId) {
    if (!newOrgId || newOrgId === admin.orgId) return;

    setBusyId(admin.id);

    try {
      await updateDoc(doc(db, "users", admin.id), {
        orgId: newOrgId,
        updatedAt: serverTimestamp(),
      });

      await log("ADMIN_REASSIGNED", {
        adminEmail: admin.email,
        fromOrg: admin.orgId,
        toOrg: newOrgId,
      });

      await loadData();
    } catch (err) {
      console.error("❌ Admin reassignment failed", err);
      alert("Failed to reassign admin.");
    } finally {
      setBusyId(null);
    }
  }

  async function softDelete(admin) {
    if (!window.confirm(`Soft delete ${admin.email}?`)) return;

    setBusyId(admin.id);

    try {
      await updateDoc(doc(db, "users", admin.id), {
        deleted: true,
        status: "disabled",
        deletedAt: serverTimestamp(),
      });

      await log("ADMIN_SOFT_DELETED", {
        adminEmail: admin.email,
        orgId: admin.orgId,
      });

      await loadData();
    } catch (err) {
      console.error("❌ Soft delete failed", err);
      alert("Failed to delete admin.");
    } finally {
      setBusyId(null);
    }
  }

  const visibleAdmins = admins.filter(a => {
    if (search && !a.email.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterOrg && a.orgId !== filterOrg) {
      return false;
    }
    return true;
  });

  if (loading) {
    return <div style={{ padding: 24 }}>Loading admins…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={header}>
        <h1>Admins</h1>
        <button
          onClick={() => navigate("/super/admins/create")}
          style={createBtn}
        >
          + Create Admin
        </button>
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Search email"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}>
          <option value="">All orgs</option>
          {orgs.map(o => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Email</th>
            <th style={th}>Org</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {visibleAdmins.map(a => (
            <tr key={a.id} style={tr}>
              <td style={td}>{a.email}</td>
              <td style={{ ...td, fontFamily: "monospace" }}>{a.orgId}</td>
              <td style={td}><b>{a.status || "active"}</b></td>

              <td style={td}>
                <button onClick={() => resendReset(a.email)} style={btnWarn}>
                  Reset
                </button>

                <select
                  disabled={busyId === a.id}
                  onChange={e => reassignAdmin(a, e.target.value)}
                  defaultValue=""
                  style={{ marginLeft: 8 }}
                >
                  <option value="">Move Org</option>
                  {orgs
                    .filter(o => o.id !== a.orgId)
                    .map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                </select>

                {a.status === "disabled" ? (
                  <button
                    disabled={busyId === a.id}
                    onClick={() => toggleAdmin(a, true)}
                    style={btnPrimary}
                  >
                    Enable
                  </button>
                ) : (
                  <button
                    disabled={busyId === a.id}
                    onClick={() => toggleAdmin(a, false)}
                    style={btnDanger}
                  >
                    Disable
                  </button>
                )}

                <button
                  disabled={busyId === a.id}
                  onClick={() => softDelete(a)}
                  style={btnDanger}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {visibleAdmins.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 20, color: "#777" }}>
                No admins found.
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
  padding: "6px 10px",   // SAME as Create Organisation
  fontSize: 13,
  background: "#1e88e5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 500,
  cursor: "pointer",
};

const btnPrimary = {
  marginLeft: 8,
  padding: "6px 12px",
  background: "#1e88e5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const btnDanger = {
  marginLeft: 8,
  padding: "6px 12px",
  background: "#e53935",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const btnWarn = {
  padding: "6px 12px",
  background: "#f9a825",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
