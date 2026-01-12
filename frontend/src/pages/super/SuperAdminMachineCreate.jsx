// src/pages/super/SuperAdminMachineCreate.jsx
import React, { useState } from "react";
import {
  doc,
  setDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseClient";
import { useAdmin } from "../../contexts/AdminContext";

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <input {...props} style={input} />
    </div>
  );
}

export default function SuperAdminMachineCreate() {
  console.log("🔥 SuperAdminMachineCreate MOUNTED");

  const navigate = useNavigate();
  const { user } = useAdmin();

  const [form, setForm] = useState({
    id: "",
    name: "",
    location: "",
    capacity: "",
  });

  const [saving, setSaving] = useState(false);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function createMachine(e) {
    e.preventDefault();

    if (!form.id || !form.name) {
      alert("Machine ID and name required");
      return;
    }

    setSaving(true);

    try {
      await setDoc(doc(db, "machines", form.id), {
        id: form.id,
        name: form.name,
        location: form.location || null,
        capacity: Number(form.capacity) || null,
        orgId: null,
        assigned: false,
        status: "unassigned",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_actions"), {
        action: "MACHINE_CREATED",
        machineId: form.id,
        machineName: form.name,
        performedBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      navigate("/super/machines");
    } catch (err) {
      console.error("❌ Machine creation failed", err);
      alert("Failed to create machine.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, padding: 24 }}>
      <h1>Create Machine</h1>

      <form onSubmit={createMachine}>
        <Field
          label="Machine ID"
          name="id"
          value={form.id}
          onChange={updateField}
          placeholder="MACHINE_10012"
        />

        <Field
          label="Machine Name"
          name="name"
          value={form.name}
          onChange={updateField}
          placeholder="Snackmaster Lobby"
        />

        <Field
          label="Location (optional)"
          name="location"
          value={form.location}
          onChange={updateField}
        />

        <Field
          label="Capacity (optional)"
          name="capacity"
          type="number"
          value={form.capacity}
          onChange={updateField}
        />

        <div style={{ marginTop: 24 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? "Creating…" : "Create Machine"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/super/machines")}
            style={btnSecondary}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const input = {
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
