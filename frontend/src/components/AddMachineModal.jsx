// frontend/src/components/AddMachineModal.jsx
import React, { useState } from "react";
import { db } from "../firebaseClient";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  writeBatch,
} from "firebase/firestore";

export default function AddMachineModal({ onClose }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("active");

  // NEW: slot generator controls
  const [trayCount, setTrayCount] = useState(6);        // default 6 trays
  const [slotsPerTray, setSlotsPerTray] = useState(10); // default 10 slots per tray
  const [defaultSlotCap, setDefaultSlotCap] = useState("");

  // generated slots preview: [{ tray, slot_number, capacity }]
  const [slots, setSlots] = useState([]);

  const [saving, setSaving] = useState(false);

  function generateSlots() {
    let t = Number(trayCount);
    let s = Number(slotsPerTray);

    if (!t || !s || t <= 0 || s <= 0) {
      alert("Please enter valid tray and slots per tray values.");
      return;
    }

    // safety clamp for trays
    if (t > 7) t = 7;

    // pick base capacity: use user-entered defaultSlotCap OR auto-calculated from machine capacity
    let baseCap = Number(defaultSlotCap);
    const totalSlots = t * s;

    if (!baseCap || baseCap <= 0) {
      const capNum = Number(capacity);
      // simple auto formula: divide machine capacity roughly evenly
      if (capNum && capNum > 0 && totalSlots > 0) {
        baseCap = Math.max(1, Math.floor(capNum / totalSlots));
      } else {
        baseCap = 10; // sensible fallback
      }
    }

    const generated = [];
    for (let tray = 1; tray <= t; tray++) {
      for (let slot = 1; slot <= s; slot++) {
        generated.push({
          tray,
          slot_number: slot,
          capacity: baseCap,
        });
      }
    }

    setSlots(generated);
    alert(`Slots generated: ${totalSlots} slots (${t} trays × ${s} slots).`);
  }

  async function saveMachine() {
    if (!id || !location || !capacity) {
      alert("Please fill Machine ID, Location, and Capacity.");
      return;
    }

    if (!slots.length) {
      const confirmGen = confirm(
        "No slots generated yet. Generate slots automatically before saving?"
      );
      if (confirmGen) {
        generateSlots();
      } else {
        // allow machine without slots (not recommended, but don't block)
      }
    }

    try {
      setSaving(true);

      // 1) Create / update machine document
      await setDoc(
        doc(db, "machines", id),
        {
          name,
          location,
          capacity: Number(capacity),
          status,
          current_stock_percent: 100,
          last_refill_at: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          trayCount: Number(trayCount) || null,
          slotsPerTray: Number(slotsPerTray) || null,
        },
        { merge: true }
      );

      // 2) If we have slots, create subcollection machines/{id}/slots
      if (slots.length) {
        const batch = writeBatch(db);
        const baseCol = collection(db, "machines", id, "slots");

        slots.forEach((slot) => {
          const slotId = `${slot.tray}-${slot.slot_number}`; // e.g. "1-3"
          const ref = doc(baseCol, slotId);
          batch.set(ref, {
            tray: slot.tray,
            slot_number: slot.slot_number,
            capacity: Number(slot.capacity) || 0,
            current_qty: 0,
            product_id: null,
            product_name: "",
            merged: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        await batch.commit();
      }

      alert("Machine and slots added successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error adding machine.");
    } finally {
      setSaving(false);
    }
  }

  // Helper to update per-slot capacity inline
  function updateSlotCapacity(index, newCap) {
    const cap = Number(newCap);
    setSlots((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], capacity: cap };
      return copy;
    });
  }

  return (
    <div style={modalBackdrop}>
      <div style={modalBox}>
        <h2>Add Machine</h2>

        {/* BASIC MACHINE INFO */}
        <div style={field}>
          <label>Machine ID *</label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="_v00001"
          />
        </div>

        <div style={field}>
          <label>Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Machine name"
          />
        </div>

        <div style={field}>
          <label>Location *</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Hyderabad, floor, etc."
          />
        </div>

        <div style={field}>
          <label>Total Capacity *</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="e.g. 200"
          />
        </div>

        <div style={field}>
          <label>Status *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="service-down">Service Down</option>
          </select>
        </div>

        <hr style={{ margin: "16px 0" }} />

        {/* SLOT GENERATOR CONTROLS */}
        <h3 style={{ marginTop: 0 }}>Slot Configuration</h3>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ ...field, flex: 1 }}>
            <label>Number of trays</label>
            <input
              type="number"
              min={1}
              max={7}
              value={trayCount}
              onChange={(e) => setTrayCount(e.target.value)}
            />
          </div>

          <div style={{ ...field, flex: 1 }}>
            <label>Slots per tray</label>
            <input
              type="number"
              min={1}
              max={10}
              value={slotsPerTray}
              onChange={(e) => setSlotsPerTray(e.target.value)}
            />
          </div>

          <div style={{ ...field, flex: 1 }}>
            <label>Default slot capacity</label>
            <input
              type="number"
              min={1}
              value={defaultSlotCap}
              onChange={(e) => setDefaultSlotCap(e.target.value)}
              placeholder="auto from total if empty"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={generateSlots}
          style={{
            marginTop: 4,
            marginBottom: 10,
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            background: "#3498db",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Generate Slots
        </button>

        {/* SLOTS PREVIEW */}
        {slots.length > 0 && (
          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              marginTop: 6,
              border: "1px solid #eee",
              borderRadius: 8,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead style={{ background: "#f7f7f7" }}>
                <tr>
                  <th style={th}>Tray</th>
                  <th style={th}>Slot</th>
                  <th style={th}>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, idx) => (
                  <tr
                    key={`${slot.tray}-${slot.slot_number}`}
                    style={{ borderBottom: "1px solid #f0f0f0" }}
                  >
                    <td style={td}>{slot.tray}</td>
                    <td style={td}>{slot.slot_number}</td>
                    <td style={td}>
                      <input
                        type="number"
                        value={slot.capacity}
                        onChange={(e) =>
                          updateSlotCapacity(idx, e.target.value)
                        }
                        style={{
                          width: "80px",
                          padding: "4px 6px",
                          borderRadius: 4,
                          border: "1px solid #ccc",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button onClick={onClose} style={btnCancel} disabled={saving}>
            Cancel
          </button>
          <button onClick={saveMachine} style={btnSave} disabled={saving}>
            {saving ? "Saving..." : "Save Machine"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* STYLES */
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
  width: "520px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
};

const field = {
  marginBottom: 12,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
};

const th = {
  textAlign: "left",
  padding: "6px 8px",
  fontWeight: 600,
  color: "#555",
};

const td = {
  padding: "6px 8px",
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
