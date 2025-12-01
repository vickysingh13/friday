// -------------------------------
// SNACKMASTER BACKEND (FINAL FIXED)
// -------------------------------
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

console.log("🔥 Loading Firebase Admin...");

// Load serviceAccountKey.json directly (REQUIRED FOR LOCAL DEV)
const serviceKeyPath = path.join(__dirname, "serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(require(serviceKeyPath))
});

const db = admin.firestore();
console.log("🔥 Firebase Admin initialized");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// -------------------------------
// CALCULATE STOCK PERCENT
// -------------------------------
function computePercent(remainingSum, capacity) {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(100, Math.round((remainingSum / capacity) * 100));
}

// -------------------------------
// GET ALL MACHINES
// -------------------------------
app.get("/api/machines", async (req, res) => {
  try {
    const snap = await db.collection("machines").get();
    const machines = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ machines });
  } catch (err) {
    console.error("GET /machines error:", err);
    res.status(500).json({ error: "failed" });
  }
});

// -------------------------------
// GET SINGLE MACHINE
// -------------------------------
app.get("/api/machines/:id", async (req, res) => {
  try {
    const ref = db.collection("machines").doc(req.params.id);
    const docu = await ref.get();

    if (!docu.exists) return res.status(404).json({ error: "not found" });

    res.json({ machine: { id: docu.id, ...docu.data() } });
  } catch (err) {
    console.error("GET /machines/:id error:", err);
    res.status(500).json({ error: "failed" });
  }
});

// -------------------------------
// PROCESS CSV → UPDATE STOCK PERCENT
// -------------------------------
app.post("/api/process-csv", async (req, res) => {
  try {
    const { machineId, results, capacity } = req.body;

    if (!machineId || !Array.isArray(results)) {
      return res.status(400).json({ error: "invalid input" });
    }

    let remainingSum = 0;
    results.forEach((r) => {
      remainingSum += Number(r.remainingQty) || 0;
    });

    const percent = computePercent(remainingSum, capacity || 100);

    await db.collection("machines").doc(machineId).set(
      {
        current_stock_percent: percent,
        last_csv_processed_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`📊 CSV processed → Machine ${machineId} updated: ${percent}%`);

    res.json({ ok: true, percent, remainingSum });
  } catch (err) {
    console.error("POST /process-csv error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// -------------------------------
// CONFIRM REFILL → SAVE REFILL LOG
// -------------------------------
app.post("/api/confirm-refill", async (req, res) => {
  try {
    const { machineId, userEmail } = req.body;

    if (!machineId) return res.status(400).json({ error: "missing machineId" });

    const snap = await db.collection("machines").doc(machineId).get();
    const mData = snap.exists ? snap.data() : {};

    await db.collection("machines").doc(machineId).set(
      {
        current_stock_percent: 100,
        last_refill_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await db.collection("refill_logs").add({
      machineId,
      machineName: mData.name || null,
      machineLocation: mData.location || null,
      previousPercent: mData.current_stock_percent || 0,
      newPercent: 100,
      capacity: mData.capacity || null,
      userEmail: userEmail || "unknown",
      action: "refill_complete",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`🟢 Refill logged for ${machineId} by ${userEmail}`);

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /confirm-refill error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// -------------------------------
// START SERVER
// -------------------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
