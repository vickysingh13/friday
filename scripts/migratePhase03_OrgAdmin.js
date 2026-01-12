/**
 * PHASE 0.3.2 — MIGRATE ALL DATA TO ORG ADMIN
 */

const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

const TARGET_ORG = "ORG_FRANCHISE_HYD";
const TARGET_ADMIN_EMAIL = "vdsofficial@snackmaster.in";

async function migrateCollection(name, queryFn = null) {
  console.log(`🔹 Migrating collection: ${name}`);
  let ref = db.collection(name);
  let snap = queryFn ? await queryFn(ref) : await ref.get();

  let batch = db.batch();
  let count = 0;

  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      orgId: TARGET_ORG,
      adminEmail: TARGET_ADMIN_EMAIL,
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;
  });

  if (count > 0) await batch.commit();
  console.log(`✅ ${name}: ${count} docs migrated`);
}

async function migrateMachines() {
  console.log("🔹 Migrating machines + slots");
  const machinesSnap = await db.collection("machines").get();

  for (const machine of machinesSnap.docs) {
    await machine.ref.update({
      orgId: TARGET_ORG,
      adminEmail: TARGET_ADMIN_EMAIL,
    });

    const slotsSnap = await machine.ref.collection("slots").get();
    let batch = db.batch();

    slotsSnap.docs.forEach((slot) => {
      batch.update(slot.ref, {
        orgId: TARGET_ORG,
        adminEmail: TARGET_ADMIN_EMAIL,
      });
    });

    if (slotsSnap.docs.length > 0) await batch.commit();
  }

  console.log("✅ Machines + slots migrated");
}

async function main() {
  try {
    await migrateMachines();

    await migrateCollection("refill_logs");
    await migrateCollection("refiller_actions");
    await migrateCollection("admin_actions");
    await migrateCollection("refill_snapshots");
    await migrateCollection("csv_uploads");
    await migrateCollection("warehouse_picklists");

    console.log("\n🎉 PHASE 0.3.2 COMPLETE — DATA OWNERSHIP FIXED\n");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

main();
