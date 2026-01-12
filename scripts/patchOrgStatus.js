/**
 * PATCH ORGANISATION STATUS
 * Ensures every organisation has:
 *   status: "active"
 *   suspended: false
 */

const admin = require("firebase-admin");
const path = require("path");

// 🔐 Init Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(
    require(path.join(__dirname, "serviceAccountKey.json"))
  ),
});

const db = admin.firestore();

async function patchOrgStatus() {
  console.log("🔧 Patching organisation status...");

  const snap = await db.collection("organisations").get();

  console.log(`📦 Organisations found: ${snap.size}`);

  if (snap.empty) {
    console.warn("⚠️ No organisation documents found — nothing to patch");
    return;
  }

  const batch = db.batch();
  let updated = 0;

  snap.docs.forEach(doc => {
    const data = doc.data();

    const update = {};

    if (!data.status) update.status = "active";
    if (data.suspended === undefined) update.suspended = false;

    if (Object.keys(update).length > 0) {
      batch.update(doc.ref, update);
      updated++;
      console.log(`📝 Updating org: ${doc.id}`, update);
    }
  });

  if (updated > 0) {
    await batch.commit();
    console.log(`✅ Organisations updated: ${updated}`);
  } else {
    console.log("ℹ️ All organisations already up-to-date");
  }
}

patchOrgStatus()
  .then(() => {
    console.log("🎉 Organisation status patch complete");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ patchOrgStatus failed:", err);
    process.exit(1);
  });
