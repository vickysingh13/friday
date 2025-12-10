// frontend/src/components/MachineDetailsUI.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import Papa from "papaparse";
import axios from "axios";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";

export default function MachineDetailsUI({ machineId, onBack }) {
  const [machine, setMachine] = useState(null);
  const [slots, setSlots] = useState([]);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);

  const [masterFile, setMasterFile] = useState(null);
  const [salesFile, setSalesFile] = useState(null);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");

  const [activeTray, setActiveTray] = useState(null); // which tray is opened in modal

  const fileInputMaster = useRef();
  const fileInputSales = useRef();
  const user = JSON.parse(localStorage.getItem("sm_user") || "{}");

  // ─────────────────────────────────────────
  // LOAD MACHINE / SLOTS / PRODUCTS / LOGS
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!machineId) return;
    loadMachine();
    loadSlots();
    loadProducts();
    loadMyLogs();
  }, [machineId]);

  async function loadMachine() {
    try {
      const m = await getDoc(doc(db, "machines", machineId));
      if (m.exists()) setMachine({ id: m.id, ...m.data() });
    } catch (e) {
      console.error("Failed to load machine", e);
    }
  }

  async function loadSlots() {
    try {
      const snap = await getDocs(collection(db, `machines/${machineId}/slots`));
      setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Failed to load slots", e);
    }
  }

  async function loadProducts() {
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(list);
    } catch (e) {
      console.error("Failed to load products", e);
    }
  }

  async function loadMyLogs() {
    try {
      const qRef = query(
        collection(db, "refill_logs"),
        where("machineId", "==", machineId),
        where("userEmail", "==", user.email),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(qRef);
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Failed to load logs", e);
    }
  }

  // group slots by tray for tray buttons
  const trays = useMemo(() => {
    const map = {};
    slots.forEach((s) => {
      const t = s.tray || 1;
      if (!map[t]) map[t] = [];
      map[t].push(s);
    });
    return Object.entries(map).sort(
      ([a], [b]) => Number(a) - Number(b)
    ); // [[trayNumber, slots[]], ...]
  }, [slots]);

  // ─────────────────────────────────────────
  // CSV UTILS
  // ─────────────────────────────────────────
  function parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (r) => resolve(r.data),
        error: reject,
      });
    });
  }

  async function handleCalculate() {
    if (!masterFile || !salesFile) return alert("Upload both CSV files");
    setStatus("Parsing...");

    try {
      const master = await parseCSV(masterFile);
      const sales = await parseCSV(salesFile);

      const stock = {};
      master.forEach((row) => {
        const name = row.Name || row.name;
        const qty = Number(row.qty || row.quantity || 0);
        if (!name) return;
        stock[name] = (stock[name] || 0) + qty;
      });

      const sold = {};
      sales.forEach((row) => {
        const name = row.Name || row.name;
        if (!name) return;
        sold[name] = (sold[name] || 0) + 1;
      });

      const out = Object.keys(stock).map((name) => ({
        name,
        masterQty: stock[name],
        salesQty: sold[name] || 0,
        remainingQty: Math.max(0, stock[name] - (sold[name] || 0)),
      }));

      setResults(out);
      setStatus("Ready to confirm");
    } catch (e) {
      console.error(e);
      setStatus("Error while parsing");
    }
  }

  async function confirmRefill() {
    if (!results || results.length === 0) {
      if (!confirm("No CSV result table yet. Confirm refill anyway?")) return;
    } else {
      if (!confirm("Confirm refill using current CSV results?")) return;
    }

    setStatus("Saving...");

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/confirm-refill`, {
        machineId,
        userEmail: user.email,
        results,
      });

      await loadMachine();
      await loadMyLogs();
      setStatus("Refill confirmed");
    } catch (e) {
      console.error(e);
      setStatus("Error submitting refill");
    }
  }

  // ─────────────────────────────────────────
  // SLOT EDITING HELPERS
  // ─────────────────────────────────────────
  function handleSlotFieldChange(slotId, field, value) {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              [field]:
                field === "capacity" || field === "current_qty"
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
            }
          : s
      )
    );
  }

  async function saveSlot(slot) {
    try {
      const product =
        products.find((p) => p.id === slot.product_id) ||
        products.find((p) => p.name === slot.product_name);

      await updateDoc(doc(db, `machines/${machineId}/slots`, slot.id), {
        tray: slot.tray ?? null,
        slot_number: slot.slot_number ?? null,
        product_id: product ? product.id : slot.product_id || null,
        product_name: product ? product.name : slot.product_name || null,
        capacity: Number(slot.capacity) || 0,
        current_qty: Number(slot.current_qty) || 0,
        updatedAt: serverTimestamp(),
      });

      alert("Slot updated");
      await loadSlots(); // reload to stay in sync
    } catch (e) {
      console.error(e);
      alert("Failed to update slot");
    }
  }

  function labelForProduct(p) {
    const parts = [];
    if (p.name) parts.push(p.name);
    if (p.sku) parts.push(`(${p.sku})`);
    return parts.join(" ");
  }

  function getSlotSelectedProductId(slot) {
    if (slot.product_id) return slot.product_id;
    if (slot.product_name) {
      const match = products.find((p) => p.name === slot.product_name);
      if (match) return match.id;
    }
    return "";
  }

  // Placeholder merge / demerge – to avoid corrupting slot data now.
  function handleMergeClick() {
    alert(
      "Merge / Demerge behaviour will be added after we design how to store merged capacities safely."
    );
  }

  if (!machine) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={btnBack}>
          ← Back
        </button>
        <p>Loading machine...</p>
      </div>
    );
  }

  // slots of the tray currently opened in modal
  const activeTraySlots =
    activeTray == null
      ? []
      : slots
          .filter((s) => (s.tray || 1) === activeTray)
          .sort((a, b) => (a.slot_number || 0) - (b.slot_number || 0));

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <button onClick={onBack} style={btnBack}>
          ← Back
        </button>

        <div>
          <h2 style={{ margin: 0 }}>{machine?.name || machineId}</h2>
          <p style={{ color: "#555", marginTop: 4 }}>{machine?.location}</p>
        </div>

        <div style={{ textAlign: "right", fontSize: 14 }}>
          <div>
            <b>Capacity:</b> {machine?.capacity}
          </div>
          <div>
            <b>Stock:</b> {machine?.current_stock_percent}%
          </div>
          <div>
            <b>Last Refill:</b>{" "}
            {machine?.last_refill_at?.seconds
              ? new Date(
                  machine.last_refill_at.seconds * 1000
                ).toLocaleString("en-IN")
              : "-"}
          </div>
        </div>
      </div>

      {/* TRAY OVERVIEW CARD */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h3 style={{ margin: 0 }}>Tray / Slot Configuration</h3>
          <span style={{ fontSize: 12, color: "#888" }}>
            Tap a tray to edit its slots (product, capacity & qty).
          </span>
        </div>

        {trays.length === 0 ? (
          <p style={{ marginTop: 12 }}>No slots configured yet.</p>
        ) : (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {trays.map(([trayNumber, traySlots]) => (
              <button
                key={trayNumber}
                style={trayChip}
                onClick={() => setActiveTray(Number(trayNumber))}
              >
                <div style={{ fontWeight: 700 }}>Tray {trayNumber}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {traySlots.length} slots
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CSV INVENTORY TOOL SECTION */}
      <h3 style={{ marginTop: 30 }}>CSV Inventory Tool</h3>

      <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
        <div
          style={csvCard}
          onClick={() =>
            fileInputMaster.current && fileInputMaster.current.click()
          }
        >
          <h4 style={{ marginBottom: 6 }}>Master CSV</h4>
          <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
            Upload or drag file here
          </p>
          <small style={{ fontSize: 11, color: "#999" }}>
            Expected: product &amp; quantity
          </small>
          <input
            ref={fileInputMaster}
            type="file"
            style={{ display: "none" }}
            accept=".csv"
            onChange={(e) => setMasterFile(e.target.files[0])}
          />
        </div>

        <div
          style={csvCard}
          onClick={() =>
            fileInputSales.current && fileInputSales.current.click()
          }
        >
          <h4 style={{ marginBottom: 6 }}>Sales CSV</h4>
          <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
            Upload or drag file here
          </p>
          <small style={{ fontSize: 11, color: "#999" }}>
            Expected: vends / transactions
          </small>
          <input
            ref={fileInputSales}
            type="file"
            style={{ display: "none" }}
            accept=".csv"
            onChange={(e) => setSalesFile(e.target.files[0])}
          />
        </div>
      </div>

      {/* CSV BUTTONS */}
      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <button style={btnPrimary} onClick={handleCalculate}>
          Calculate
        </button>
        <button style={btnSuccess} onClick={confirmRefill}>
          Confirm Refill
        </button>
        {status && (
          <span style={{ fontSize: 13, color: "#555" }}>
            Status: <b>{status}</b>
          </span>
        )}
      </div>

      {/* RESULT TABLE */}
      {results.length > 0 && (
        <table style={{ width: "100%", marginTop: 20, fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thSmall}>Product</th>
              <th style={thSmall}>Master</th>
              <th style={thSmall}>Sales</th>
              <th style={thSmall}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td style={tdSmall}>{r.name}</td>
                <td style={tdSmall}>{r.masterQty}</td>
                <td style={tdSmall}>{r.salesQty}</td>
                <td style={tdSmall}>{r.remainingQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* REFILL HISTORY CARD */}
      <div style={{ ...card, marginTop: 30 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h3 style={{ margin: 0 }}>Refill History (You Only)</h3>
          <span style={{ fontSize: 12, color: "#666" }}>
            Total refills: <b>{logs.length}</b>
          </span>
        </div>

        {logs.length === 0 ? (
          <p style={{ marginTop: 10 }}>No refills yet.</p>
        ) : (
          <table style={{ width: "100%", marginTop: 10, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thSmall}>Time</th>
                <th style={thSmall}>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={tdSmall}>
                    {l.createdAt?.seconds
                      ? new Date(
                          l.createdAt.seconds * 1000
                        ).toLocaleString("en-IN")
                      : "-"}
                  </td>
                  <td style={tdSmall}>{l.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* TRAY EDITOR MODAL */}
      {activeTray != null && (
        <div style={trayModalBackdrop}>
          <div style={trayModalBox}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0 }}>Tray {activeTray} – Slots</h3>
              <button
                style={btnTinyGhost}
                onClick={() => setActiveTray(null)}
              >
                Close
              </button>
            </div>

            {activeTraySlots.length === 0 ? (
              <p>No slots in this tray.</p>
            ) : (
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={thSmall}>Slot</th>
                    <th style={thSmall}>Product</th>
                    <th style={thSmall}>Capacity</th>
                    <th style={thSmall}>Current Qty</th>
                    <th style={thSmall}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTraySlots.map((s) => {
                    const selectedProductId = getSlotSelectedProductId(s);
                    return (
                      <tr key={s.id}>
                        <td style={tdSmall}>{s.slot_number}</td>

                        <td style={tdSmall}>
                          <select
                            style={inputSelect}
                            value={selectedProductId}
                            onChange={(e) =>
                              handleSlotFieldChange(
                                s.id,
                                "product_id",
                                e.target.value
                              )
                            }
                          >
                            <option value="">-- Select product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {labelForProduct(p)}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={tdSmall}>
                          <input
                            type="number"
                            min="0"
                            style={inputNumber}
                            value={
                              s.capacity === undefined || s.capacity === null
                                ? ""
                                : s.capacity
                            }
                            onChange={(e) =>
                              handleSlotFieldChange(
                                s.id,
                                "capacity",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td style={tdSmall}>
                          <input
                            type="number"
                            min="0"
                            style={inputNumber}
                            value={
                              s.current_qty === undefined ||
                              s.current_qty === null
                                ? ""
                                : s.current_qty
                            }
                            onChange={(e) =>
                              handleSlotFieldChange(
                                s.id,
                                "current_qty",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td style={tdSmall}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              style={btnTinyPrimary}
                              onClick={() => saveSlot(s)}
                            >
                              Save
                            </button>
                            <button
                              style={btnTinyGhost}
                              onClick={handleMergeClick}
                              title="Merge with neighbouring slot (coming soon)"
                            >
                              Merge
                            </button>
                            <button
                              style={btnTinyGhost}
                              onClick={handleMergeClick}
                              title="Demerge slot (coming soon)"
                            >
                              Demerge
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Shared styles */
const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
  marginBottom: 20,
};

const csvCard = {
  ...card,
  flex: 1,
  textAlign: "center",
  cursor: "pointer",
  marginBottom: 0,
};

const trayChip = {
  minWidth: 90,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #dde3ea",
  background: "#f9fafb",
  cursor: "pointer",
  textAlign: "left",
  boxShadow: "0 2px 4px rgba(15,23,42,0.05)",
};

const trayModalBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const trayModalBox = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  width: "640px",
  maxHeight: "80vh",
  overflowY: "auto",
  boxShadow: "0 18px 40px rgba(15,23,42,0.35)",
};

const btnBack = {
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};

const btnPrimary = {
  padding: "10px 18px",
  background: "#3498db",
  color: "#fff",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const btnSuccess = {
  padding: "10px 18px",
  background: "#27ae60",
  color: "#fff",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const thSmall = {
  textAlign: "left",
  padding: "6px 8px",
  fontWeight: 600,
  color: "#444",
};

const tdSmall = {
  padding: "6px 8px",
  borderTop: "1px solid #f3f3f3",
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

const btnTinyPrimary = {
  padding: "4px 8px",
  fontSize: 11,
  borderRadius: 6,
  border: "none",
  background: "#3498db",
  color: "#fff",
  cursor: "pointer",
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
