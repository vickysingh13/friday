// frontend/src/components/AddMachineModal.jsx
import React, { useState } from "react";
import { db } from "../firebaseClient";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AddMachineModal({ onClose }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("active");

  async function saveMachine() {
    if (!id || !location || !capacity) {
      alert("Please fill Machine ID, Location, and Capacity.");
      return;
    }

    try {
      await setDoc(doc(db, "machines", id), {
        name,
        location,
        capacity: Number(capacity),
        status,
        current_stock_percent: 100,
        last_refill_at: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert("Machine added successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error adding machine.");
    }
  }

  return (
    <div style={modalBackdrop}>
      <div style={modalBox}>
        <h2>Add Machine</h2>

        <div style={field}>
          <label>Machine ID *</label>
          <input value={id} onChange={e => setId(e.target.value)} />
        </div>

        <div style={field}>
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={field}>
          <label>Location *</label>
          <input value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div style={field}>
          <label>Capacity *</label>
          <input 
            type="number"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
          />
        </div>

        <div style={field}>
          <label>Status *</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="service-down">Service Down</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={saveMachine} style={btnSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

const modalBackdrop = {
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

const modalBox = {
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
  background: "#28a745",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};
