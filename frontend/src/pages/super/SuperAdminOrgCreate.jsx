// src/pages/super/SuperAdminOrgCreate.jsx
import React, { useState } from "react";
import {
  doc,
  setDoc,
  serverTimestamp,
  addDoc,
  collection,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseClient";
import { useAdmin } from "../../contexts/AdminContext";

/* ─────────────────────────────
   🔹 Reusable Field Component
───────────────────────────── */
function Field({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 6,
          border: error ? "1px solid #e53935" : "1px solid #ccc",
        }}
      />
      {error && (
        <div style={{ color: "#e53935", fontSize: 13, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────
   🔹 Main Component
───────────────────────────── */
export default function SuperAdminOrgCreate() {
  console.log("🔥 SuperAdminOrgCreate MOUNTED");

  const navigate = useNavigate();
  const { user } = useAdmin();

  const [form, setForm] = useState({
    id: "",
    name: "",
    adminEmail: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* ───────── FIELD UPDATE ───────── */
  function updateField(e) {
    const { name, value } = e.target;

    // Force ORG ID uppercase
    if (name === "id") {
      setForm({ ...form, id: value.toUpperCase().trim() });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  /* ───────── VALIDATION ───────── */
  function validate() {
    const e = {};

    if (!form.id.match(/^ORG_[A-Z0-9_]+$/)) {
      e.id = "Org ID must start with ORG_ and contain only capitals";
    }

    if (!form.name.trim()) {
      e.name = "Organisation name is required";
    }

    if (!form.adminEmail.match(/^\S+@\S+\.\S+$/)) {
      e.adminEmail = "Valid admin email is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ───────── CREATE ORG ───────── */
  async function createOrganisation(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrors({});

    try {
      /* 1️⃣ Prevent duplicate org ID */
      const orgRef = doc(db, "organisations", form.id);
      const existingOrg = await getDoc(orgRef);
      if (existingOrg.exists()) {
        throw new Error("Organisation ID already exists");
      }

      /* 2️⃣ Create organisation */
      const orgPayload = {
        id: form.id,
        name: form.name.trim(),
        adminEmail: form.adminEmail.trim(),
        status: "active",
        suspended: false,
        suspendedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(orgRef, orgPayload);

      /* 3️⃣ Audit log */
      await addDoc(collection(db, "admin_actions"), {
        action: "ORG_CREATED",
        entityType: "organisation",
        entityId: form.id,
        orgId: form.id,
        snapshot: orgPayload,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      navigate("/super/orgs");
    } catch (err) {
      console.error("❌ Create organisation failed", err);
      setErrors({ global: err.message });
    } finally {
      setSaving(false);
    }
  }

  /* ───────── UI ───────── */
  return (
    <div style={{ maxWidth: 520, padding: 24 }}>
      <h1 style={{ marginBottom: 20 }}>Create Organisation</h1>

      {errors.global && (
        <div style={{ color: "#e53935", marginBottom: 16 }}>
          {errors.global}
        </div>
      )}

      <form onSubmit={createOrganisation}>
        <Field
          label="Organisation ID"
          name="id"
          value={form.id}
          onChange={updateField}
          placeholder="ORG_FRANCHISE_MUM"
          error={errors.id}
        />

        <Field
          label="Organisation Name"
          name="name"
          value={form.name}
          onChange={updateField}
          placeholder="Mumbai Franchise"
          error={errors.name}
        />

        <Field
          label="Admin Email"
          name="adminEmail"
          value={form.adminEmail}
          onChange={updateField}
          placeholder="admin@example.com"
          error={errors.adminEmail}
        />

        <div style={{ marginTop: 24 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 16px",
              background: "#1e88e5",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Creating…" : "Create Organisation"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/super/orgs")}
            style={{
              marginLeft: 12,
              padding: "10px 16px",
              background: "#e0e0e0",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
