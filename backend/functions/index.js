const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  admin.initializeApp({
    credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  });
} else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
} else {
  try { admin.initializeApp(); } catch(e){ console.warn('No credentials'); }
}

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '5mb'}));

function computePercent(remainingSum, capacity) {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(100, Math.round((remainingSum / capacity) * 100));
}

app.get('/api/machines', async (req, res) => {
  try {
    const snap = await db.collection('machines').get();
    const machines = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ machines });
  } catch (err) { console.error(err); res.status(500).json({ error: 'failed' }); }
});

app.get('/api/machines/:id', async (req, res) => {
  try {
    const doc = await db.collection('machines').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'not found' });
    res.json({ machine: { id: doc.id, ...doc.data() } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'failed' }); }
});

app.post('/api/process-csv', async (req, res) => {
  try {
    const { machineId, results, capacity } = req.body;
    if (!machineId || !Array.isArray(results)) return res.status(400).json({ error: 'invalid' });
    const remainingSum = results.reduce((s, r) => s + (Number(r.remainingQty) || 0), 0);
    const percent = computePercent(remainingSum, capacity || 100);
    await db.collection('machines').doc(machineId).set({
      current_stock_percent: percent,
      last_csv_processed_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ ok: true, percent, remainingSum });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server error' }); }
});

app.post('/api/confirm-refill', async (req, res) => {
  try {
    const { machineId, userEmail } = req.body;
    if (!machineId) return res.status(400).json({ error: 'missing machineId' });

    // 1) Read machine info
    const mDoc = await db.collection('machines').doc(machineId).get();
    const mData = mDoc.exists ? mDoc.data() : {};

    // 2) Update machine stock to 100%
    await db.collection('machines').doc(machineId).set({
      current_stock_percent: 100,
      last_refill_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 3) Write FULL log entry
    await db.collection('refill_logs').add({
      machineId,
      machineName: mData.name || null,
      machineLocation: mData.location || null,
      userEmail: userEmail || null,
      capacity: mData.capacity || null,
      previousPercent: mData.current_stock_percent || 0,
      newPercent: 100,
      action: "refill_complete",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log('Server listening on', PORT));
