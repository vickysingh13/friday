// src/pages/super/SuperAdminAdminCreate.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebaseClient";
import { useAdmin } from "../../contexts/AdminContext";

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <input {...props} style={inputStyle} />
    </div>
  );
}

export default function SuperAdminAdminCreate() {
  console.log("🔥 SuperAdminAdminCreate MOUNTED");

  const navigate = useNavigate();
  const { user } = useAdmin();

  const [orgs, setOrgs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", orgId: "" });

  useEffect(() => {
    async function loadOrgs() {
      const snap = await getDocs(collection(db, "organisations"));
      setOrgs(snap.docs.map(d => d.data()));
    }
    loadOrgs();
  }, []);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function createAdmin(e) {
    e.preventDefault();

    if (!form.email || !form.orgId) {
      alert("All fields required");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "users"), {
        email: form.email.trim(),
        role: "admin",
        orgId: form.orgId,
        createdAt: serverTimestamp(),
      });

      await sendPasswordResetEmail(auth, form.email.trim());

      await addDoc(collection(db, "admin_actions"), {
        action: "ADMIN_CREATED",
        adminEmail: form.email.trim(),
        orgId: form.orgId,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      alert("Admin created & password reset sent.");
      navigate("/super/admins");
    } catch (err) {
      console.error("❌ Admin creation failed", err);
      alert("Failed to create admin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, padding: 24 }}>
      <h1>Create Admin</h1>

      <form onSubmit={createAdmin}>
        <Field
          label="Admin Email"
          name="email"
          value={form.email}
          onChange={updateField}
        />

        <label style={{ fontWeight: 600 }}>Organisation</label>
        <select
          name="orgId"
          value={form.orgId}
          onChange={updateField}
          style={inputStyle}
        >
          <option value="">Select organisation</option>
          {orgs.map(o => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.id})
            </option>
          ))}
        </select>

        <div style={{ marginTop: 24 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? "Creating…" : "Create Admin"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/super/admins")}
            style={btnSecondary}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: 6,
  border: "1px solid #ccc",
};

const btnPrimary = {
  padding: "10px 16px",
  background: "#1e88e5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
};

const btnSecondary = {
  marginLeft: 12,
  padding: "10px 16px",
};
