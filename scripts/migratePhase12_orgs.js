/**
 * PHASE 1.2 — ORGANISATION MANAGEMENT MIGRATION
 */

const admin = require("firebase-admin");
const path = require("path");

admin.initializeApp({
  credential: admin.credential.cert(
    require(path.join(__dirname, "serviceAccountKey.json"))
  ),
});

const db = admin.firestore();

async function main() {
  console.log("🔹 Creating organisation documents...");

  const orgs = [
    {
      id: "ORG_SUPER",
      name: "Super Admin Org",
      status: "active",
      adminEmail: null,
    },
    {
      id: "ORG_FRANCHISE_HYD",
      name: "Hyderabad Franchise",
      status: "active",
      adminEmail: "vdsofficial@snackmaster.in",
    },
  ];

  const batch = db.batch();

  for (const org of orgs) {
    const ref = db.collection("organisations").doc(org.id);
    batch.set(ref, {
      ...org,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log("✅ Organisations created");

  console.log("🔹 Normalizing machines...");
  const machines = await db.collection("machines").get();

  for (const m of machines.docs) {
    await m.ref.update({
      status: "active",
      assigned: true,
    });
  }

  console.log("🎉 PHASE 1.2 STEP 1 COMPLETE");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
