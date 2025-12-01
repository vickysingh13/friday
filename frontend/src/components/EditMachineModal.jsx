// frontend/src/components/EditMachineModal.jsx
import React, { useState } from "react";
import { db } from "../firebaseClient";
import { doc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";

export default function EditMachineModal({ machine, onClose }) {
  const [name, setName] = useState(machine.name || "");
  const [location, setLocation] = useState(machine.location || "");
  const [capacity, setCapacity] = useState(machine.capacity || "");
  const [status, setStatus] = useState(machine.status || "active");

  async function saveChanges() {
    if (!machine.id) {
      alert("Machine ID missing.");
      return;
    }

    try {
      // UPDATE MACHINE DOCUMENT
      await updateDoc(doc(db, "machines", machine.id), {
        name,
        location,
        capacity: Number(capacity),
        status,
        updatedAt: serverTimestamp()
      });

      // AUDIT LOG
      const user = JSON.parse(localStorage.getItem("sm_user") || "{}");
      await addDoc(collection(db, "admin_actions"), {
        actorEmail: user.email || "unknown",
        actionType: "edit_machine",
        machineId: machine.id,
        changes: { name, location, capacity, status },
        createdAt: serverTimestamp()
      });

      alert("Machine updated successfully!");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error updating machine.");
    }
  }

  return (
    <div style={backdrop}>
      <div style={modal}>
        <h2>Edit Machine</h2>

        <p style={{ fontSize: 12, color: "#666" }}>Machine ID: <b>{machine.id}</b></p>

        <div style={field}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div style={field}>
          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div style={field}>
          <label>Capacity</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>

        <div style={field}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="service-down">Service Down</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={saveChanges} style={btnSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modal = {
  background: "#fff",
  padding: 24,
  borderRadius: 10,
  width: "420px",
  boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
};

const field = {
  marginBottom: 12,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const btnCancel = {
  padding: "8px 14px",
  background: "#999",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
};

const btnSave = {
  padding: "8px 14px",
  background: "#3498db",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};
