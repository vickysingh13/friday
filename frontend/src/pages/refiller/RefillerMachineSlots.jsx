// frontend/src/pages/refiller/RefillerMachineSlots.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseClient";

export default function RefillerMachineSlots() {
  const { machineId } = useParams();
  const nav = useNavigate();

  const [machine, setMachine] = useState(null);
  const [slots, setSlots] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingSlot, setEditingSlot] = useState(null);
  const [saving, setSaving] = useState(false);

  const smUser = JSON.parse(localStorage.getItem("sm_user") || "{}");
  const myUID = smUser.uid;
  const myEmail = smUser.email;

  useEffect(() => {
    if (!machineId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machineId]);

  async function loadAll() {
    setLoading(true);
    try {
      // 1) machine doc
      const mSnap = await getDoc(doc(db, "machines", machineId));
      if (!mSnap.exists()) {
        alert("Machine not found");
        nav("/"); // back
        return;
      }
      const m = { id: mSnap.id, ...mSnap.data() };

      // ensure this machine is assigned to current refiller
      if (!m.assignedTo || m.assignedTo !== myUID) {
        alert("You are not assigned to this machine.");
        nav("/"); // redirect to refiller home/dashboard
        return;
      }
      setMachine(m);

      // 2) slots
      const snapSlots = await getDocs(collection(db, "machines", machineId, "slots"));
      const slotsList = snapSlots.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSlots(slotsList);

      // 3) products
      const snapProducts = await getDocs(collection(db, "products"));
      const prodList = snapProducts.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(prodList);
    } catch (e) {
      console.error("Failed to load refiller slots", e);
      alert("Error loading machine or slots.");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // Helpers (same visual codes as admin)
  // -----------------------
  function traysFromSlots() {
    const setT = new Set();
    slots.forEach((s) => {
      if (s.tray != null) setT.add(s.tray);
    });
    return Array.from(setT).sort((a, b) => a - b);
  }

  // hide merged children (those that have merged_into set)
  function slotsForTray(tray) {
    return slots
      .filter((s) => s.tray === tray && !s.merged_into)
      .sort((a, b) => (a.slot_number || 0) - (b.slot_number || 0));
  }

  function displayCodeForSlot(slot) {
    if (!slot.tray || !slot.slot_number) return slot.id;
    const tray = Number(slot.tray);
    const s = Number(slot.slot_number);
    const code = 110 + (tray - 1) * 10 + s;
    return String(code);
  }

  function groupForRootSlot(rootSlot) {
    const children = slots.filter((s) => s.merged_into === rootSlot.id);
    return [rootSlot, ...children];
  }

  function displayCodeRange(rootSlot) {
    const group = groupForRootSlot(rootSlot);
    if (group.length === 1) return displayCodeForSlot(rootSlot);
    const codes = group.map((s) => parseInt(displayCodeForSlot(s), 10));
    const minC = Math.min(...codes);
    const maxC = Math.max(...codes);
    return `${minC}-${maxC}`;
  }

  function getSelectedProductId(slot) {
    if (slot.product_id) return slot.product_id;
    if (slot.product_name) {
      const match = products.find((p) => p.name === slot.product_name);
      if (match) return match.id;
    }
    return "";
  }

  // -----------------------
  // Editor open/close
  // -----------------------
  function openSlotEditor(slot) {
    // slot is root (not merged_into). create a local clone with 'original' snapshot
    const clone = {
      ...slot,
      capacity: slot.capacity == null ? "" : slot.capacity,
      current_qty: slot.current_qty == null ? "" : slot.current_qty,
      product_id: getSelectedProductId(slot),
      __original: {
        capacity: slot.capacity,
        current_qty: slot.current_qty,
        product_id: getSelectedProductId(slot),
        product_name: slot.product_name || "",
      },
    };
    setEditingSlot(clone);
  }

  function closeSlotEditor() {
    setEditingSlot(null);
  }

  function handleEditingFieldChange(field, value) {
    if (!editingSlot) return;
    setEditingSlot((prev) => {
      if (!prev) return prev;
      if (field === "capacity" || field === "current_qty") {
        return { ...prev, [field]: value === "" ? "" : Number(value) };
      }
      // product change: reset current_qty to 0 (as requested)
      if (field === "product_id") {
        return { ...prev, product_id: value, current_qty: 0 };
      }
      return { ...prev, [field]: value };
    });
  }

  // Build field changes array for audit
  function computeFieldChanges(original, updated) {
    const changes = [];
    if (original.product_id !== updated.product_id) {
      changes.push({
        field: "product_id",
        old: original.product_id || null,
        new: updated.product_id || null,
      });
    }
    if ((original.capacity || 0) !== (updated.capacity || 0)) {
      changes.push({
        field: "capacity",
        old: original.capacity || null,
        new: updated.capacity || null,
      });
    }
    if ((original.current_qty || 0) !== (updated.current_qty || 0)) {
      changes.push({
        field: "current_qty",
        old: original.current_qty || null,
        new: updated.current_qty || null,
      });
    }
    return changes;
  }

  // -----------------------
  // Save changes (refiller)
  // -----------------------
  async function saveEditingSlot() {
    if (!editingSlot) return;
    const { id, capacity, current_qty, product_id, __original } = editingSlot;

    // validation: current_qty <= capacity (block)
    if (current_qty !== "" && capacity !== "" && Number(current_qty) > Number(capacity)) {
      alert("Current quantity cannot be greater than capacity.");
      return;
    }

    setSaving(true);
    try {
      // Find product name if product_id is present
      const product = products.find((p) => p.id === product_id);

      // Prepare payload
      const payload = {
        capacity: Number(capacity) || 0,
        current_qty: Number(current_qty) || 0,
        product_id: product ? product.id : product_id || null,
        product_name: product ? product.name : editingSlot.product_name || "",
        updatedAt: serverTimestamp(),
      };

      // Update slot doc (if merged root, editing affects only root doc)
      await updateDoc(doc(db, "machines", machineId, "slots", id), payload);

      // Write a refiller action / audit record
      const fieldChanges = computeFieldChanges(
        {
          product_id: __original.product_id,
          capacity: __original.capacity,
          current_qty: __original.current_qty,
        },
        {
          product_id: payload.product_id,
          capacity: payload.capacity,
          current_qty: payload.current_qty,
        }
      );

      await addDoc(collection(db, "refiller_actions"), {
        actorUid: myUID || null,
        actorEmail: myEmail || null,
        machineId,
        slotId: id,
        fieldChanges,
        createdAt: serverTimestamp(),
      });

      // reload
      await loadAll();
      alert("Slot saved.");
      closeSlotEditor();
    } catch (e) {
      console.error("Failed to save slot", e);
      alert("Error saving slot.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !machine) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => nav(-1)} style={btnBack}>
          ← Back
        </button>
        <p style={{ marginTop: 12 }}>Loading machine...</p>
      </div>
    );
  }

  const trays = traysFromSlots();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => nav(-1)} style={btnBack}>
          ← Back
        </button>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0 }}>Machine – {machine.id}</h2>
          <p style={{ margin: 4, color: "#666" }}>{machine.name || ""} · {machine.location || ""}</p>
        </div>

        <div style={{ textAlign: "right", fontSize: 13 }}>
          <div><b>Trays:</b> {trays.length || "-"}</div>
          <div><b>Total slots:</b> {slots.length}</div>
          <div><b>Status:</b> {machine.status || "-"}</div>
        </div>
      </div>

      <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, background: "#fff7e6", border: "1px solid #ffe0a3", color: "#8a5a00" }}>
        You can update product, capacity and current quantity for slots assigned to you. Capacity is shown as single-slot capacity even for merged lanes.
      </div>

      {/* Horizontal trays */}
      {trays.length === 0 ? (
        <div style={card}><p>No slots configured for this machine.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {trays.map((tray) => {
            const traySlots = slotsForTray(tray);
            return (
              <div key={tray} style={trayRow}>
                <div style={trayLabel}>Tray {tray}</div>
                <div style={slotsRow}>
                  {traySlots.map((slot) => {
                    const group = groupForRootSlot(slot);
                    const label = displayCodeRange(slot);
                    const primaryProduct = slot.product_name || "Empty";

                    return (
                      <div key={slot.id} style={slotPill} onClick={() => openSlotEditor(slot)} title={group.length > 1 ? `${label} · merged (${group.length} slots)` : label}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
                        <div style={{ fontSize: 12, color: primaryProduct === "Empty" ? "#999" : "#222" }}>{primaryProduct}</div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{slot.current_qty ?? 0}/{slot.capacity ?? 0}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor modal */}
      {editingSlot && (
        <div style={modalBackdrop}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Edit {displayCodeRange(editingSlot)}</h3>
            <div style={{ color: "#666", marginBottom: 8 }}>Tray {editingSlot.tray} · internal ID: {editingSlot.id}</div>

            <div style={field}>
              <label>Product</label>
              <select value={editingSlot.product_id || ""} onChange={(e) => handleEditingFieldChange("product_id", e.target.value)} style={inputSelect}>
                <option value="">-- Empty --</option>
                {products.map((p) => (<option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>))}
              </select>
              <small style={{ color: "#666" }}>Changing product resets current quantity to 0.</small>
            </div>

            <div style={field}>
              <label>Capacity</label>
              <input type="number" min="0" value={editingSlot.capacity} onChange={(e) => handleEditingFieldChange("capacity", e.target.value)} style={inputNumber} />
            </div>

            <div style={field}>
              <label>Current quantity</label>
              <input type="number" min="0" value={editingSlot.current_qty} onChange={(e) => handleEditingFieldChange("current_qty", e.target.value)} style={inputNumber} />
              <small style={{ color: "#666" }}>Cannot be greater than capacity.</small>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button onClick={closeSlotEditor} style={btnCancel} disabled={saving}>Cancel</button>
              <button onClick={saveEditingSlot} style={btnSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* styles reused (match admin) */
const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
};

const trayRow = {
  ...card,
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const trayLabel = {
  minWidth: 100,
  fontWeight: 700,
  fontSize: 15,
  color: "#111",
};

const slotsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const slotPill = {
  minWidth: 96,
  padding: "8px 10px",
  borderRadius: 10,
  background: "#f5f7fb",
  border: "1px solid #dde3f0",
  cursor: "pointer",
  fontSize: 13,
  textAlign: "center",
};

const btnBack = {
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};

const modalBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalBox = {
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  width: 480,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
};

const field = { marginBottom: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 13 };
const inputSelect = { width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 };
const inputNumber = { width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 };
const btnCancel = { padding: "8px 12px", background: "#999", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" };
const btnSave = { padding: "8px 12px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 };

