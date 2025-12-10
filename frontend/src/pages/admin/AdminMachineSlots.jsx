// frontend/src/pages/admin/AdminMachineSlots.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebaseClient";
console.log("ACTIVE SLOT PAGE VERSION = FINAL BASE");


export default function AdminMachineSlots() {
  const { machineId } = useParams();
  const nav = useNavigate();

  const [machine, setMachine] = useState(null);
  const [slots, setSlots] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal for single-slot edit
  const [editingSlot, setEditingSlot] = useState(null);
  const [savingSlot, setSavingSlot] = useState(false);
  const [mergeBusy, setMergeBusy] = useState(false);

  useEffect(() => {
    if (!machineId) return;
    loadAll();
  }, [machineId]);

  async function loadAll() {
    setLoading(true);
    try {
      // 1) machine
      const m = await getDoc(doc(db, "machines", machineId));
      if (m.exists()) setMachine({ id: m.id, ...m.data() });

      // 2) slots
      const snapSlots = await getDocs(
        collection(db, "machines", machineId, "slots")
      );
      const slotsList = snapSlots.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setSlots(slotsList);

      // 3) products
      const snapProducts = await getDocs(collection(db, "products"));
      const prodList = snapProducts.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(prodList);
    } catch (e) {
      console.error("Failed to load machine/slots/products", e);
      alert("Error loading slot configuration");
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────
  // helpers
  // ─────────────────────────────────────
  function traysFromSlots() {
    const set = new Set();
    slots.forEach((s) => {
      if (s.tray != null) set.add(s.tray);
    });
    return Array.from(set).sort((a, b) => a - b);
  }

  // NOTE: we hide merged children (those that have merged_into set)
  function slotsForTray(tray) {
    return slots
      .filter((s) => s.tray === tray && !s.merged_into)
      .sort((a, b) => (a.slot_number || 0) - (b.slot_number || 0));
  }

  // visual 3-digit code like 111, 112, 121, 122 etc
  function displayCodeForSlot(slot) {
    if (!slot.tray || !slot.slot_number) return slot.id;
    const tray = Number(slot.tray);
    const s = Number(slot.slot_number);
    const code = 110 + (tray - 1) * 10 + s; // tray1=>111..120 ; tray2=>121..130 etc
    return String(code);
  }

  // all members of a merged group: root slot + children merged_into that root
  function groupForRootSlot(rootSlot) {
    const children = slots.filter((s) => s.merged_into === rootSlot.id);
    return [rootSlot, ...children];
  }

  // label like "111" or "111-112" or "111-113"
  function displayCodeRange(rootSlot) {
    const group = groupForRootSlot(rootSlot);
    if (group.length === 1) return displayCodeForSlot(rootSlot);

    const codes = group.map((s) => parseInt(displayCodeForSlot(s), 10));
    const minC = Math.min(...codes);
    const maxC = Math.max(...codes);
    return `${minC}-${maxC}`;
  }

  function labelForProduct(p) {
    const parts = [];
    if (p.name) parts.push(p.name);
    if (p.sku) parts.push(`(${p.sku})`);
    return parts.join(" ");
  }

  function getSelectedProductId(slot) {
    if (slot.product_id) return slot.product_id;
    if (slot.product_name) {
      const match = products.find((p) => p.name === slot.product_name);
      if (match) return match.id;
    }
    return "";
  }

  function openSlotEditor(slot) {
    // clone to avoid direct mutation
    setEditingSlot({
      ...slot,
      capacity:
        slot.capacity === undefined || slot.capacity === null
          ? ""
          : slot.capacity,
      current_qty:
        slot.current_qty === undefined || slot.current_qty === null
          ? ""
          : slot.current_qty,
      product_id: getSelectedProductId(slot),
    });
  }

  function closeSlotEditor() {
    setEditingSlot(null);
  }

  function handleEditingFieldChange(field, value) {
    setEditingSlot((prev) =>
      prev
        ? {
            ...prev,
            [field]:
              field === "capacity" || field === "current_qty"
                ? value === ""
                  ? ""
                  : Number(value)
                : value,
          }
        : prev
    );
  }

  async function saveEditingSlot() {
    if (!editingSlot) return;
    setSavingSlot(true);
    try {
      const { id, tray, slot_number, capacity, current_qty, product_id } =
        editingSlot;

      const product = products.find((p) => p.id === product_id);

      await updateDoc(doc(db, "machines", machineId, "slots", id), {
        tray: tray ?? null,
        slot_number: slot_number ?? null,
        capacity: Number(capacity) || 0,
        current_qty: Number(current_qty) || 0,
        product_id: product ? product.id : product_id || null,
        product_name: product ? product.name : editingSlot.product_name || "",
        updatedAt: serverTimestamp(),
      });

      await loadAll();
      alert("Slot updated");
      closeSlotEditor();
    } catch (e) {
      console.error("Failed to update slot", e);
      alert("Error updating slot");
    } finally {
      setSavingSlot(false);
    }
  }

  // ─────────────────────────────────────
  // DELETE ALL SLOTS + REGENERATE
  // ─────────────────────────────────────
  async function deleteAllSlots(skipConfirm = false) {
    if (!skipConfirm) {
      const ok = window.confirm(
        "Delete ALL slots for this machine? This cannot be undone."
      );
      if (!ok) return;
    }

    try {
      const snap = await getDocs(collection(db, "machines", machineId, "slots"));
      const deletions = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletions);
      await loadAll();
      if (!skipConfirm) alert("All slots deleted.");
    } catch (e) {
      console.error("Failed to delete all slots", e);
      alert("Error deleting all slots.");
    }
  }

  async function regenerateSlotsPrompt() {
    if (
      !window.confirm(
        "This will DELETE all existing slots and create a fresh grid. Continue?"
      )
    ) {
      return;
    }

    let trayStr = window.prompt("Number of trays (1–7)?", "3");
    if (!trayStr) return;
    let traysNum = Number(trayStr);
    if (!traysNum || traysNum < 1 || traysNum > 7) {
      alert("Invalid tray count. Must be between 1 and 7.");
      return;
    }

    let slotsStr = window.prompt("Slots per tray (1–10)?", "10");
    if (!slotsStr) return;
    let slotsNum = Number(slotsStr);
    if (!slotsNum || slotsNum < 1 || slotsNum > 10) {
      alert("Invalid slots per tray. Must be between 1 and 10.");
      return;
    }

    let capStr = window.prompt("Default capacity per slot?", "10");
    if (!capStr) return;
    let defaultCap = Number(capStr);
    if (!defaultCap || defaultCap < 1) {
      alert("Invalid capacity.");
      return;
    }

    try {
      await deleteAllSlots(true); // silent delete
      const tasks = [];
      for (let t = 1; t <= traysNum; t++) {
        for (let s = 1; s <= slotsNum; s++) {
          tasks.push(
            addDoc(collection(db, "machines", machineId, "slots"), {
              tray: t,
              slot_number: s,
              capacity: defaultCap,
              current_qty: 0,
              product_id: null,
              product_name: "",
              merged_into: null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          );
        }
      }
      await Promise.all(tasks);
      await loadAll();
      alert("Slots regenerated successfully.");
    } catch (e) {
      console.error("Failed to regenerate slots", e);
      alert("Error regenerating slots.");
    }
  }

  // ─────────────────────────────────────
  // DELETE SINGLE SLOT + RENNUMBER
  // ─────────────────────────────────────
  async function renumberTray(trayNumber) {
    try {
      const snap = await getDocs(collection(db, "machines", machineId, "slots"));
      const traySlots = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.tray === trayNumber)
        .sort((a, b) => (a.slot_number || 0) - (b.slot_number || 0));

      let next = 1;
      const updates = [];

      for (const s of traySlots) {
        if (s.slot_number !== next) {
          updates.push(
            updateDoc(
              doc(db, "machines", machineId, "slots", s.id),
              {
                slot_number: next,
                updatedAt: serverTimestamp(),
              }
            )
          );
        }
        next++;
      }

      if (updates.length) {
        await Promise.all(updates);
      }
    } catch (e) {
      console.error("Failed to renumber tray", e);
      // don't block UX with an alert here; just log
    }
  }

  async function deleteSingleSlot(slot) {
    if (!slot) return;
    if (
      !window.confirm(
        `Delete slot ${displayCodeForSlot(slot)} permanently?\n(Any merged children will remain as-is.)`
      )
    ) {
      return;
    }

    try {
      const trayNumber = slot.tray;
      await deleteDoc(doc(db, "machines", machineId, "slots", slot.id));
      // Renumber the remaining slots in this tray so codes stay continuous
      await renumberTray(trayNumber);
      await loadAll();
      alert("Slot deleted and tray re-numbered.");
      closeSlotEditor();
    } catch (e) {
      console.error("Failed to delete slot", e);
      alert("Error deleting slot.");
    }
  }

  // ─────────────────────────────────────
  // ADD NEW SLOT INSIDE A TRAY
  // ─────────────────────────────────────
  async function handleAddSlot(tray) {
    try {
      const traySlots = slots.filter((s) => s.tray === tray);
      const maxSlotNumber = traySlots.reduce(
        (max, s) => Math.max(max, Number(s.slot_number) || 0),
        0
      );

      if (maxSlotNumber >= 10) {
        alert("This tray already has the maximum of 10 slots.");
        return;
      }

      const newNumber = maxSlotNumber + 1;

      await addDoc(collection(db, "machines", machineId, "slots"), {
        tray,
        slot_number: newNumber,
        capacity: 10,
        current_qty: 0,
        product_id: null,
        product_name: "",
        merged_into: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await loadAll();
      alert(`Added slot ${displayCodeForSlot({ tray, slot_number: newNumber })}`);
    } catch (e) {
      console.error("Failed to add slot", e);
      alert("Error adding new slot.");
    }
  }

  // ─────────────────────────────────────
  // MERGE / DEMERGE LOGIC (soft-merge Option A)
  // ─────────────────────────────────────

  // Merge current slot with right neighbor (same tray, slot_number+1)
  async function handleMergeRight() {
    if (!editingSlot) return;
    if (editingSlot.merged_into) {
      alert(
        "Open the base slot (e.g. 111) to merge. This slot is already merged into another."
      );
      return;
    }

    const root = slots.find((s) => s.id === editingSlot.id);
    if (!root) {
      alert("Root slot not found in current data.");
      return;
    }

    const neighbor = slots.find(
      (s) =>
        s.tray === root.tray &&
        s.slot_number === root.slot_number + 1 &&
        !s.merged_into
    );

    if (!neighbor) {
      alert("No right neighbor slot available to merge with.");
      return;
    }

    const confirmMsg = `Merge slots ${displayCodeForSlot(
      root
    )} and ${displayCodeForSlot(neighbor)} into a single wide slot?`;
    if (!window.confirm(confirmMsg)) return;

    setMergeBusy(true);
    try {
      const rootRef = doc(db, "machines", machineId, "slots", root.id);
      const neighborRef = doc(db, "machines", machineId, "slots", neighbor.id);

      const newCapacity =
        (Number(root.capacity) || 0) + (Number(neighbor.capacity) || 0);

      await Promise.all([
        updateDoc(rootRef, {
          capacity: newCapacity,
          updatedAt: serverTimestamp(),
        }),

        updateDoc(neighborRef, {
          merged_into: root.id,
          capacity: 0,
          current_qty: 0,
          product_id: null,
          product_name: "",
          updatedAt: serverTimestamp(),
        }),
      ]);

      await loadAll();
      alert("Slots merged successfully.");
      closeSlotEditor();
    } catch (e) {
      console.error("Merge failed", e);
      alert("Failed to merge slots.");
    } finally {
      setMergeBusy(false);
    }
  }

  // Demerge current slot (must be root). All children merged_into it will be restored.
  async function handleDemerge() {
    if (!editingSlot) return;

    if (editingSlot.merged_into) {
      alert("Open the base/root slot (e.g. 111) to demerge this group.");
      return;
    }

    const root = slots.find((s) => s.id === editingSlot.id);
    if (!root) {
      alert("Root slot not found.");
      return;
    }

    const children = slots.filter((s) => s.merged_into === root.id);
    if (children.length === 0) {
      alert("This slot is not part of a merged group.");
      return;
    }

    if (
      !window.confirm(
        `Demerge group ${displayCodeRange(
          root
        )}? This will split capacity approximately evenly and clear products on child slots.`
      )
    ) {
      return;
    }

    setMergeBusy(true);
    try {
      const totalSlots = children.length + 1;
      const totalCap = Number(root.capacity) || 0;
      const eachCap =
        totalSlots > 0
          ? Math.max(1, Math.floor(totalCap / totalSlots))
          : 10;

      const updates = [];

      updates.push(
        updateDoc(doc(db, "machines", machineId, "slots", root.id), {
          capacity: eachCap,
          updatedAt: serverTimestamp(),
        })
      );

      children.forEach((child) => {
        updates.push(
          updateDoc(doc(db, "machines", machineId, "slots", child.id), {
            merged_into: null,
            capacity: eachCap,
            current_qty: 0,
            product_id: null,
            product_name: "",
            updatedAt: serverTimestamp(),
          })
        );
      });

      await Promise.all(updates);
      await loadAll();
      alert("Slots demerged.");
      closeSlotEditor();
    } catch (e) {
      console.error("Demerge failed", e);
      alert("Failed to demerge slots.");
    } finally {
      setMergeBusy(false);
    }
  }

  if (loading || !machine) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => nav(-1)} style={btnBack}>
          ← Back
        </button>
        <p style={{ marginTop: 12 }}>Loading machine slot configuration...</p>
      </div>
    );
  }

  const trays = traysFromSlots();

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <button onClick={() => nav(-1)} style={btnBack}>
          ← Back
        </button>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0 }}>Configure Slots – {machine.id}</h2>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              margin: "10px 0",
            }}
          >
            <button style={btnRed} onClick={() => deleteAllSlots(false)}>
              Delete All Slots
            </button>
            <button style={btnBlue} onClick={regenerateSlotsPrompt}>
              Regenerate Slots
            </button>
          </div>

          <p style={{ margin: 4, color: "#666" }}>
            {machine.name || "Unnamed"} · {machine.location || "No location"}
          </p>
        </div>

        <div style={{ textAlign: "right", fontSize: 13 }}>
          <div>
            <b>Trays:</b> {trays.length || "-"}
          </div>
          <div>
            <b>Total slots:</b> {slots.length}
          </div>
          <div>
            <b>Status:</b> {machine.status || "unknown"}
          </div>
        </div>
      </div>

      {/* INFO NOTE */}
      <div
        style={{
          marginBottom: 16,
          padding: 10,
          borderRadius: 8,
          background: "#fff7e6",
          border: "1px solid #ffe0a3",
          fontSize: 13,
          color: "#8a5a00",
        }}
      >
        Admin-only slot designer. You can change product, capacity and current
        quantity per slot.
        <br />
        <b>Merge Right</b> combines the next slot into this one.{" "}
        <b>Demerge</b> splits a merged lane back into individual slots.
      </div>

      {/* HORIZONTAL TRAY VIEW */}
      {trays.length === 0 ? (
        <div style={card}>
          <p>No slots found for this machine. You may need to generate slots.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {trays.map((tray) => {
            const traySlots = slotsForTray(tray);
            return (
              <div key={tray} style={trayRow}>
                <div style={trayLeft}>
                  <div style={trayLabel}>Tray {tray}</div>
                  <button
                    type="button"
                    style={btnTinyAdd}
                    onClick={() => handleAddSlot(tray)}
                  >
                    + Add Slot
                  </button>
                </div>
                <div style={slotsRow}>
                  {traySlots.map((slot) => {
                    const group = groupForRootSlot(slot);
                    const label = displayCodeRange(slot);
                    const primaryProductName = slot.product_name || "Empty";

                    return (
                      <div
                        key={slot.id}
                        style={slotPill}
                        onClick={() => openSlotEditor(slot)}
                        title={
                          group.length > 1
                            ? `${label} · merged (${group.length} slots)`
                            : label
                        }
                      >
                        <div style={slotCodeText}>{label}</div>
                        <div
                          style={{
                            fontSize: 13,
                            color:
                              primaryProductName === "Empty" ? "#999" : "#222",
                            fontWeight:
                              primaryProductName === "Empty" ? 400 : 500,
                          }}
                        >
                          {primaryProductName}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#666",
                            marginTop: 2,
                          }}
                        >
                          {slot.current_qty ?? 0}/{slot.capacity ?? 0}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLOT EDIT MODAL */}
      {editingSlot && (
        <div style={modalBackdrop}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>
              Edit Slot {displayCodeRange(editingSlot)}
            </h3>

            <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
              Tray {editingSlot.tray} · Internal ID: {editingSlot.id}
            </div>

            {/* PRODUCT SELECT */}
            <div style={field}>
              <label>Product</label>
              <select
                style={inputSelect}
                value={editingSlot.product_id || ""}
                onChange={(e) =>
                  handleEditingFieldChange("product_id", e.target.value)
                }
              >
                <option value="">-- Empty slot --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {labelForProduct(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* CAPACITY */}
            <div style={field}>
              <label>Capacity</label>
              <input
                type="number"
                min="0"
                style={inputNumber}
                value={
                  editingSlot.capacity === "" || editingSlot.capacity == null
                    ? ""
                    : editingSlot.capacity
                }
                onChange={(e) =>
                  handleEditingFieldChange("capacity", e.target.value)
                }
              />
            </div>

            {/* CURRENT QTY */}
            <div style={field}>
              <label>Current Quantity</label>
              <input
                type="number"
                min="0"
                style={inputNumber}
                value={
                  editingSlot.current_qty === "" ||
                  editingSlot.current_qty == null
                    ? ""
                    : editingSlot.current_qty
                }
                onChange={(e) =>
                  handleEditingFieldChange("current_qty", e.target.value)
                }
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
                alignItems: "center",
              }}
            >
              {/* merge/demerge controls */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={btnTinyGhost}
                  onClick={handleMergeRight}
                  disabled={mergeBusy}
                  title="Merge this slot with the next one on the right"
                >
                  Merge Right →
                </button>
                <button
                  type="button"
                  style={btnTinyGhost}
                  onClick={handleDemerge}
                  disabled={mergeBusy}
                  title="Demerge this merged lane back to individual slots"
                >
                  Demerge
                </button>
              </div>

              {/* actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={closeSlotEditor}
                  style={btnCancel}
                  disabled={savingSlot || mergeBusy}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => deleteSingleSlot(editingSlot)}
                  style={btnDanger}
                  disabled={savingSlot || mergeBusy}
                >
                  Delete Slot
                </button>

                <button
                  type="button"
                  onClick={saveEditingSlot}
                  style={btnSave}
                  disabled={savingSlot || mergeBusy}
                >
                  {savingSlot ? "Saving..." : "Save Slot"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* basic styles reused */

const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
};

const trayRow = {
  ...card,
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const trayLeft = {
  minWidth: 110,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const trayLabel = {
  fontWeight: 700,
  fontSize: 15,
  color: "#111",
};

const slotsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const slotPill = {
  minWidth: 90,
  padding: "8px 10px",
  borderRadius: 10,
  background: "#f5f7fb",
  border: "1px solid #dde3f0",
  cursor: "pointer",
};

const slotCodeText = {
  fontWeight: 700,
  fontSize: 14,
  marginBottom: 2,
};

const btnBack = {
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};

/* modal styles */
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
  width: 440,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
};

const field = {
  marginBottom: 10,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
};

const inputSelect = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 13,
};

const inputNumber = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 13,
};

const btnCancel = {
  padding: "6px 12px",
  background: "#999",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
};

const btnSave = {
  padding: "6px 12px",
  background: "#28a745",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const btnDanger = {
  padding: "6px 12px",
  background: "#e74c3c",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const btnTinyGhost = {
  padding: "4px 8px",
  fontSize: 11,
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "#f7f7f7",
  color: "#555",
  cursor: "pointer",
};

const btnRed = {
  padding: "6px 12px",
  background: "#c0392b",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const btnBlue = {
  padding: "6px 12px",
  background: "#3498db",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const btnTinyAdd = {
  padding: "4px 8px",
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid #3498db",
  background: "#ecf6ff",
  color: "#1f6fb2",
  cursor: "pointer",
  alignSelf: "flex-start",
};
